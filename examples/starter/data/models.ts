export interface Model {
  id: string;
  name: string;
  description: string;
}

export const models: Model[] = [
  { 
    id: 'gpt-oss-120b', 
    name: 'GPT-OSS-120B (Best Quality)', 
    description: 'OpenAI open-source 120B parameters' 
  },
  { 
    id: 'gpt-oss-20b', 
    name: 'GPT-OSS-20B (Fast)', 
    description: 'OpenAI open-source 20B parameters' 
  },
  { 
    id: '@cf/meta/llama-3.3-70b-instruct', 
    name: 'Llama 3.3 70B', 
    description: "Meta's latest 70B model" 
  },
  { 
    id: '@cf/meta/llama-3.1-8b-instruct', 
    name: 'Llama 3.1 8B', 
    description: 'Fast, lightweight 8B model' 
  },
  { 
    id: '@cf/mistral/mistral-7b-instruct-v0.2', 
    name: 'Mistral 7B', 
    description: 'Efficient 7B model' 
  }
];