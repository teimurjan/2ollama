export interface CodestralRequest {
  model?: string;
  prompt: string;
  suffix?: string;
  max_tokens?: number;
  min_tokens?: number;
  temperature?: number;
  top_p?: number;
  stop?: string | string[];
  stream?: boolean;
  random_seed?: number;
}

export interface OllamaRequest {
  model: string;
  prompt: string;
  suffix?: string;
  stream: boolean;
  options: {
    temperature?: number;
    top_p?: number;
    stop?: string[];
    num_predict?: number;
    seed?: number;
  };
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  done_reason?: string;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface CodestralResponse {
  id: string;
  object: string;
  model: string;
  created: number;
  choices: {
    index: number;
    message: {
      content: string;
      role: string;
      tool_calls: null;
      prefix: boolean;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
