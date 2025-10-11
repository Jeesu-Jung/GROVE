from transformers import AutoTokenizer, AutoModel
import pandas as pd
import torch
from torch import nn
from tqdm import tqdm
 
def kl_divergence(p, q, epsilon=1e-8):
    p = p + epsilon
    q = q + epsilon
    return torch.sum(p * (torch.log(p) - torch.log(q)))
 
def jensen_shannon_divergence(logit1, logit2):
    # Logit를 확률로 변환
    m = nn.Softmax(dim=1)
    prob1 = m(logit1)
    prob2 = m(logit2)
   
    # 중간 확률 분포 계산
    mid_prob = (prob1 + prob2) * 0.5
   
    # KL divergence 계산
    kl_div1 = kl_divergence(prob1, mid_prob)
    kl_div2 = kl_divergence(prob2, mid_prob)

    # Jensen-Shannon divergence 계산
    js_div = (kl_div1 + kl_div2) * 0.5
    return js_div.item()


def get_divergence(df, model_path):
    tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
    tokenizer.pad_token = tokenizer.eos_token 
    model = AutoModel.from_pretrained(model_path, output_hidden_states=True)
    input_column = 'inputs'
    dec_scores = []
 
    for index, row in tqdm(df.iterrows()):
        # Logits
        input_ids = tokenizer(row[input_column], return_tensors='pt', padding=True)['input_ids']
 
        # Forward pass
        with torch.no_grad():
            outputs = model(input_ids)
 
        # Logits : First + Last
        first_layer_logits = outputs.hidden_states[0]
        last_layer_logits = outputs.hidden_states[-1]
        dec_score = jensen_shannon_divergence(first_layer_logits, last_layer_logits)
 
        # # Divergence Score
        dec_scores.append(dec_score)

        print(f"\nInput: {row['inputs']}")
        print(f"Divergence Score: {dec_score:.4f}\n")
 
    df['dec_score'] = dec_scores
    return df

if __name__=="__main__":
    df = pd.read_json('data/alpaca_verb/instruction_alpaca.json', orient='records')
    df = get_divergence(df, model_path="./model/Llama-3.2-1B-Instruct")