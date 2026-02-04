#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智谱AI API 客户端
使用方法：
1. 运行脚本：py 使用智谱API.py
2. 输入你的问题或指令
3. 脚本会调用智谱AI API 并返回回答
"""

import requests
import json
import sys
import io
from typing import Optional

# 设置标准输出编码为UTF-8
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# 智谱AI API配置
ZHIPU_API_KEY = "0964d97aae0e4d868915e95a2a830e2d.JaEMrMMD3I0lZ9zf"
ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
DEFAULT_MODEL = "glm-4"

class ZhipuAIClient:
    def __init__(self, api_key: str = ZHIPU_API_KEY):
        self.api_key = api_key
        self.base_url = "https://open.bigmodel.cn/api/paas/v4"
        self.conversation_history = []
    
    def chat(self, message: str, model: str = DEFAULT_MODEL, temperature: float = 0.7) -> str:
        """
        发送消息到智谱AI
        
        Args:
            message: 用户消息
            model: 模型名称（默认：glm-4）
            temperature: 温度参数（0-1）
        
        Returns:
            AI 的回复
        """
        # 添加用户消息到历史记录
        self.conversation_history.append({
            "role": "user",
            "content": message
        })
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": self.conversation_history,
            "temperature": temperature,
            "stream": False
        }
        
        try:
            response = requests.post(
                ZHIPU_API_URL,
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                assistant_message = result["choices"][0]["message"]["content"]
                
                # 添加AI回复到历史记录
                self.conversation_history.append({
                    "role": "assistant",
                    "content": assistant_message
                })
                
                return assistant_message
            else:
                error_msg = f"API 错误: {response.status_code}"
                try:
                    error_detail = response.json()
                    if "error" in error_detail:
                        error_msg += f" - {error_detail['error']['message']}"
                except:
                    pass
                return error_msg
                
        except requests.exceptions.Timeout:
            return "错误：请求超时"
        except requests.exceptions.ConnectionError:
            return "错误：无法连接到服务器"
        except Exception as e:
            return f"错误：{str(e)}"
    
    def clear_history(self):
        """清除对话历史"""
        self.conversation_history = []
        print("对话历史已清除")
    
    def interactive_mode(self):
        """交互式对话模式"""
        print("=" * 60)
        print("智谱AI API 客户端")
        print("=" * 60)
        print(f"当前模型: {DEFAULT_MODEL}")
        print("输入 'quit' 或 'exit' 退出")
        print("输入 'clear' 清除对话历史")
        print("-" * 60)
        
        while True:
            try:
                user_input = input("\n你: ").strip()
                
                if user_input.lower() in ['quit', 'exit', '退出']:
                    print("再见！")
                    break
                
                if user_input.lower() in ['clear', '清除']:
                    self.clear_history()
                    continue
                
                if not user_input:
                    continue
                
                print("AI: ", end="", flush=True)
                response = self.chat(user_input)
                print(response)
                
            except KeyboardInterrupt:
                print("\n\n检测到中断，退出程序...")
                break
            except Exception as e:
                print(f"\n错误: {e}")
    
    def single_query(self, message: str):
        """单次查询模式"""
        response = self.chat(message)
        print(response)
        return response

def main():
    """主函数"""
    client = ZhipuAIClient()
    
    # 如果有命令行参数，则执行单次查询
    if len(sys.argv) > 1:
        message = " ".join(sys.argv[1:])
        client.single_query(message)
        return
    
    # 否则进入交互模式
    client.interactive_mode()

if __name__ == "__main__":
    main()