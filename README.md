# Análise Perfis LinkedIn

Aplicação completa (frontend + backend) para **analisar a aderência de candidatos do LinkedIn a uma vaga de emprego**, com base em dados coletados automaticamente via **PhantomBuster Scraper** e critérios definidos pelo recrutador.

---
<img width="2060" height="1332" alt="image" src="https://github.com/user-attachments/assets/f3db37a4-d699-4a7d-b82e-fb9feea5f3fa" />


## 🚀 Objetivo do Projeto

O objetivo é **automatizar o processo de triagem de perfis do LinkedIn**, permitindo que o recrutador:

1. Configure os **requisitos de uma vaga** (ex: conhecimentos, cargo, experiência mínima).
2. Adicione **links de perfis do LinkedIn** (manualmente ou via planilha do Google Sheets).
3. Execute um **scraper (PhantomBuster)** que coleta informações públicas dos perfis.
4. Analise automaticamente os candidatos, gerando um **ranking de aderência**.

Tudo isso através de uma interface simples, moderna e visual — construída em React e com backend em Node.js.

---

## 🧩 Arquitetura do Sistema

A solução é dividida em dois módulos principais:

### **1. Front-End**
- Framework: **React.js (Create React App)**
- Linguagem: **JavaScript**
- Estilização: **CSS customizado (dark mode com responsividade)**
- Comunicação com backend via **REST API**
- Componentes principais:
  - `App.js`: layout principal e controle de exibição
  - `JobForm.js`: formulário principal com ações de scraping e análise

### **2. Back-End**
- Framework: **Express.js**
- Linguagem: **TypeScript**
- Ferramentas principais:
  - **PhantomBuster API** → para executar o scraper de perfis do LinkedIn
  - **Google Sheets API** → para adicionar/ler links de perfis da planilha
  - **Axios + dotenv + CORS**
  - **Módulos de serviço**:
    - `phantom.ts`: integração com o PhantomBuster
    - `sheets.ts`: controle da planilha do Google
    - `parsing.ts`: leitura de CSVs
    - `scoring.ts`: lógica de pontuação de candidatos
- Estrutura:

```
Back-End/
├── src/
│   ├── routes/
│   │   ├── analyze.ts
│   │   ├── scraper.ts
│   │   └── sheets.ts
│   ├── services/
│   │   ├── phantom.ts
│   │   ├── sheets.ts
│   │   ├── parsing.ts
│   │   └── scoring.ts
│   └── index.ts
├── .env
├── package.json
└── tsconfig.json
```

---

## ⚙️ Tecnologias Utilizadas

| Categoria | Ferramenta / Tecnologia | Descrição |
|------------|------------------------|------------|
| **Frontend** | React.js | Framework SPA para a interface |
|  | CSS3 | Tema escuro e responsivo |
| **Backend** | Node.js + Express | Servidor e rotas API REST |
|  | TypeScript | Tipagem estática |
|  | Axios | Comunicação com APIs externas |
| **Scraping** | PhantomBuster | Captura de dados de perfis do LinkedIn |
| **Banco temporário** | Google Sheets API | Base para envio e leitura dos links |
| **Ambiente** | dotenv | Gerenciamento de variáveis |
| **Controle de acesso** | CORS | Permite chamadas entre localhost:3000 ↔ 8080 |

---

## ⚙️ Como Executar o Projeto

### 🧱 1. Clonar o Repositório

```bash
git clone https://github.com/luanjc77/analise-linkedin.git
cd analise-linkedin
```

---

### ⚙️ 2. Configurar o Backend

1. Acesse a pasta:
   ```bash
   cd Back-End
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie um arquivo `.env` na raiz do Back-End e adicione:

   ```bash
   PORT=8080
   PHANTOMBUSTER_API_KEY=<sua_chave_do_phantom>
   PHANTOMBUSTER_AGENT_ID=<id_do_phantom_scraper>
   PHANTOMBUSTER_SHEET_URL=<url_da_planilha_google>
   GOOGLE_SERVICE_ACCOUNT_EMAIL=<email_da_service_account>
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="<chave_privada>"
   LOCAL_RESULTS_CSV=./data/result.csv
   ```

4. Execute o servidor:
   ```bash
   npm run dev
   ```

   O backend será iniciado em **http://localhost:8080**

---

### 🖥️ 3. Configurar o Frontend

1. Abra um novo terminal e acesse:
   ```bash
   cd Front-End
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Execute o app React:
   ```bash
   npm start
   ```

   O frontend estará disponível em **http://localhost:3000**

---

### 🔍 4. Testar o Fluxo Completo

1. Preencha os campos da vaga.  
2. Adicione os links dos perfis do LinkedIn.  
3. Clique em **“Adicionar links à planilha”**.  
4. Clique em **“Rodar Scraper”** para executar o Phantom.  
5. Após o scraping, clique em **“Analisar”** para gerar o ranking.

---

## 📊 Resultado Esperado

- Lista com os **Top 5 candidatos mais aderentes**
- Colunas:
  - Nome
  - Score
  - Motivos (por que foi pontuado assim)
  - Link direto para o perfil

---

## 💡 Melhorias Futuras

- 🔄 Atualização automática da planilha ao rodar o scraper
- 🤖 Inclusão de IA/NLP para análise semântica de descrições
- 📈 Exportação de relatórios (PDF/CSV)
- 🌐 Deploy automático no Vercel/Render

---

## 👨‍💻 Autor

**Luan Jacomini Costa**  
📧 [luan.jacomini@clinicorp.com](mailto:luan.jacomini@clinicorp.com)  
