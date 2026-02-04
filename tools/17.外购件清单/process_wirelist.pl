#!/usr/bin/perl
use strict;
use warnings;
use Encode qw(encode decode);

# 读取shared strings
my @shared_strings;
open(my $fh, '<:encoding(utf8)', 'temp_xlsx/xl/sharedStrings.xml') or die "Cannot open sharedStrings.xml: $|";
my $content = do { local $/; <$fh> };
close($fh);

# 提取所有<t>标签的内容
while ($content =~ /<t[^>]*>([^<]*)<\/t>/g) {
    push @shared_strings, $1;
}

print "Total shared strings: " . scalar(@shared_strings) . "\n";
print "First 20 strings:\n";
for (my $i = 0; $i < 20 && $i < @shared_strings; $i++) {
    print "$i: $shared_strings[$i]\n";
}

# 读取sheet数据
open($fh, '<:encoding(utf8)', 'temp_xlsx/xl/worksheets/sheet1.xml') or die "Cannot open sheet1.xml: $!";
$content = do { local $/; <$fh> };
close($fh);

# 提取所有行
my @rows;
while ($content =~ /<row[^>]* r="(\d+)"[^>]*>(.*?)<\/row>/gs) {
    my $row_num = $1;
    my $row_content = $2;

    my %cells;
    # 提取单元格
    while ($row_content =~ /<c r="([A-Z]+\d+)"[^>]* t="(s|n)"[^>]*>\s*(?:<v[^>]*>([^<]*)<\/v>)?\s*<\/c>/g) {
        my $cell_ref = $1;
        my $cell_type = $2;
        my $value = $3 // '';

        # 提取列字母
        my $col = $cell_ref;
        $col =~ s/\d+$//;

        if ($cell_type eq 's' && $value ne '') {
            my $idx = int($value);
            if ($idx < @shared_strings) {
                $value = $shared_strings[$idx];
            }
        }

        $cells{$col} = $value;
    }

    push @rows, {num => $row_num, cells => \%cells};
}

print "\nTotal rows: " . scalar(@rows) . "\n";
print "\nFirst 5 rows:\n";
for (my $i = 0; $i < 5 && $i < @rows; $i++) {
    print "Row $rows[$i]{num}:\n";
    foreach my $col (sort keys %{$rows[$i]{cells}}) {
        print "  $col: $rows[$i]{cells}{$col}\n";
    }
}

# 查找表头行
my $header_row = undef;
my %header_cells;
for my $row (@rows) {
    if (exists $row->{cells}{B} && $row->{cells}{B} eq 'Wire ID') {
        $header_row = $row->{num};
        %header_cells = %{$row->{cells}};
        last;
    }
}

if ($header_row) {
    print "\nFound header row: $header_row\n";

    # 创建列映射
    my %col_to_field = %header_cells;

    # 查找关键字段所在的列
    my ($wire_id_col, $color_col, $size_col, $material_col, $option_col,
        $multicore_id_col, $ident_tag_col, $from_code_col, $from_pin_col,
        $to_code_col, $to_pin_col);

    foreach my $col (keys %col_to_field) {
        my $field = $col_to_field{$col};
        if ($field eq 'Wire ID') { $wire_id_col = $col; }
        elsif ($field eq 'Color') { $color_col = $col; }
        elsif ($field eq 'Size / Gauge') { $size_col = $col; }
        elsif ($field eq 'Material') { $material_col = $col; }
        elsif ($field eq 'Option') { $option_col = $col; }
        elsif ($field eq 'Multicore ID') { $multicore_id_col = $col; }
        elsif ($field eq 'Ident Tag') { $ident_tag_col = $col; }
        elsif ($field eq 'From Code') { $from_code_col = $col; }
        elsif ($field eq 'From Pin') { $from_pin_col = $col; }
        elsif ($field eq 'To Code') { $to_code_col = $col; }
        elsif ($field eq 'To Pin') { $to_pin_col = $col; }
    }

    print "\nColumn mappings:\n";
    print "  Wire ID: $wire_id_col\n" if $wire_id_col;
    print "  Color: $color_col\n" if $color_col;
    print "  Option: $option_col\n" if $option_col;
    print "  Multicore ID: $multicore_id_col\n" if $multicore_id_col;
    print "  From Code: $from_code_col\n" if $from_code_col;
    print "  To Code: $to_code_col\n" if $to_code_col;

    # 提取数据行
    my @data_rows;
    my $header_found = 0;

    for my $row (@rows) {
        if (!$header_found) {
            if ($row->{num} == $header_row) {
                $header_found = 1;
            }
            next;
        }

        # 只处理包含Multicore ID的行
        if ($multicore_id_col && exists $row->{cells}{$multicore_id_col}) {
            my $multicore_id = $row->{cells}{$multicore_id_col};

            # 筛选C或S开头的Multicore ID
            if ($multicore_id && ($multicore_id =~ /^C/ || $multicore_id =~ /^S/)) {
                my %row_data = (
                    'Wire ID' => $row->{cells}{$wire_id_col} // '',
                    'Color' => $row->{cells}{$color_col} // '',
                    'Size / Gauge' => $row->{cells}{$size_col} // '',
                    'Material' => $row->{cells}{$material_col} // '',
                    'Option' => $row->{cells}{$option_col} // '',
                    'Multicore ID' => $multicore_id,
                    'Ident Tag' => $row->{cells}{$ident_tag_col} // '',
                    'From Code' => $row->{cells}{$from_code_col} // '',
                    'From Pin' => $row->{cells}{$from_pin_col} // '',
                    'To Code' => $row->{cells}{$to_code_col} // '',
                    'To Pin' => $row->{cells}{$to_pin_col} // '',
                );
                push @data_rows, \%row_data;
            }
        }
    }

    print "\nFound " . scalar(@data_rows) . " records with C or S starting Multicore ID\n";

    # 按Multicore ID和Option分组
    my %grouped;
    for my $row (@data_rows) {
        my $key = $row->{'Multicore ID'} . '|' . $row->{'Option'};
        push @{$grouped{$key}}, $row;
    }

    print "\nGrouped into " . scalar(keys %grouped) . " different purchased items\n";

    # 生成外购件清单
    open(my $out, '>:encoding(utf8)', '外购件清单.csv') or die "Cannot create output file: $!";
    print $out "Multicore ID,Option,线束数量,Color,Size / Gauge,Material,Ident Tag,From Code,To Code\n";

    foreach my $key (sort keys %grouped) {
        my @wires = @{$grouped{$key}};
        my $first_wire = $wires[0];

        my $multicore_id = $first_wire->{'Multicore ID'};
        my $option = $first_wire->{'Option'};
        my $wire_count = scalar(@wires);
        my $color = $first_wire->{'Color'};
        my $size = $first_wire->{'Size / Gauge'};
        my $material = $first_wire->{'Material'};
        my $ident_tag = $first_wire->{'Ident Tag'};

        # 获取所有From和To代码
        my %from_codes;
        my %to_codes;
        for my $w (@wires) {
            if ($w->{'From Code'}) {
                $from_codes{$w->{'From Code'}} = 1;
            }
            if ($w->{'To Code'}) {
                $to_codes{$w->{'To Code'}} = 1;
            }
        }

        my $from_str = join(', ', sort keys %from_codes);
        my $to_str = join(', ', sort keys %to_codes);

        print $out "$multicore_id,$option,$wire_count,$color,$size,$material,$ident_tag,$from_str,$to_str\n";
    }

    close($out);
    print "\n已生成外购件清单: 外购件清单.csv\n";

} else {
    print "未找到表头行\n";
}
