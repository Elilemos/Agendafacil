import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [clientes, setClientes] = useState([]);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servicos, setServicos] = useState([]);
  const [erroServicos, setErroServicos] = useState("");
  const [nomeServico, setNomeServico] = useState("");
  const [descricaoServico, setDescricaoServico] = useState("");
  const [duracaoMinutos, setDuracaoMinutos] = useState("");
  const [preco, setPreco] = useState("");
  const [mensagemServico, setMensagemServico] = useState("");
  const [agendamentos, setAgendamentos] = useState([]);
  const [erroAgendamentos, setErroAgendamentos] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [inicio, setInicio] = useState("");
  const [erroAgendamento, setErroAgendamento] = useState("");
  const [mensagemAgendamento, setMensagemAgendamento] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");

  useEffect(() => {
    fetch("/api/clientes")
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error("Não foi possível carregar os clientes.");
        }

        return resposta.json();
      })
      .then((dados) => setClientes(dados))
      .catch(() => setErro("Não foi possível carregar os clientes."));
  }, []);

  useEffect(() => {
  fetch("/api/servicos")
    .then((resposta) => {
      if (!resposta.ok) {
        throw new Error("Não foi possível carregar os serviços.");
      }

      return resposta.json();
    })
    .then((dados) => setServicos(dados))
    .catch(() =>
      setErroServicos("Não foi possível carregar os serviços.")
    );
}, []);

  useEffect(() => {
  fetch("/api/agendamentos")
    .then((resposta) => {
      if (!resposta.ok) {
        throw new Error("Não foi possível carregar os agendamentos.");
      }

      return resposta.json();
    })
    .then((dados) => setAgendamentos(dados))
    .catch(() =>
      setErroAgendamentos("Não foi possível carregar os agendamentos.")
    );
}, []);

  async function cadastrarCliente(evento) {
    evento.preventDefault();
    setErro("");
    setMensagem("");

    try {
      const resposta = await fetch("/api/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nome, telefone }),
      });

      const novoCliente = await resposta.json();

      if (!resposta.ok) {
        throw new Error(novoCliente.error || "Não foi possível cadastrar.");
      }

      setClientes((listaAtual) => [...listaAtual, novoCliente]);
      setNome("");
      setTelefone("");
      setMensagem("Cliente cadastrado com sucesso.");
    } catch (erroEnvio) {
      setErro(erroEnvio.message);
    }
  }

    async function cadastrarServico(evento) {
  evento.preventDefault();
  setErroServicos("");
  setMensagemServico("");

  try {
    const resposta = await fetch("/api/servicos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: nomeServico,
        descricao: descricaoServico,
        duracaoMinutos: Number(duracaoMinutos),
        preco: Number(preco),
      }),
    });

    const novoServico = await resposta.json();

    if (!resposta.ok) {
      throw new Error(novoServico.error || "Não foi possível cadastrar.");
    }

    setServicos((listaAtual) => [...listaAtual, novoServico]);
    setNomeServico("");
    setDescricaoServico("");
    setDuracaoMinutos("");
    setPreco("");
    setMensagemServico("Serviço cadastrado com sucesso.");
  } catch (erroEnvio) {
    setErroServicos(erroEnvio.message);
  }
}

    async function cadastrarAgendamento(evento) {
  evento.preventDefault();
  setErroAgendamento("");
  setMensagemAgendamento("");

  try {
    const resposta = await fetch("/api/agendamentos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inicio: new Date(inicio).toISOString(),
        clienteId: Number(clienteId),
        servicoId: Number(servicoId),
      }),
    });

    const novoAgendamento = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        novoAgendamento.error || "Não foi possível criar o agendamento."
      );
    }

    setAgendamentos((listaAtual) => [...listaAtual, novoAgendamento]);
    setClienteId("");
    setServicoId("");
    setInicio("");
    setMensagemAgendamento("Agendamento criado com sucesso.");
  } catch (erroEnvio) {
    setErroAgendamento(erroEnvio.message);
  }
}

    async function cancelarAgendamento(id) {
  setErroAgendamento("");
  setMensagemAgendamento("");

  try {
    const resposta = await fetch(`/api/agendamentos/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "CANCELADO" }),
    });

    const atualizado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(atualizado.error || "Não foi possível cancelar.");
    }

    setAgendamentos((listaAtual) =>
      listaAtual.map((item) => (item.id === id ? atualizado : item))
    );
    setMensagemAgendamento("Agendamento cancelado.");
  } catch (erroEnvio) {
    setErroAgendamento(erroEnvio.message);
  }
}

    const agendamentosFiltrados =
  filtroStatus === "TODOS"
    ? agendamentos
    : agendamentos.filter(
        (agendamento) => agendamento.status === filtroStatus
      );

  return (
    <main>
      <h1>AgendaFácil</h1>
      <p>Organize clientes, serviços e horários em um só lugar.</p>

      <section>
        <h2>Cadastrar cliente</h2>

        <form onSubmit={cadastrarCliente}>
          <label>
            Nome
            <input
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              required
            />
          </label>

          <label>
            Telefone
            <input
              type="tel"
              value={telefone}
              onChange={(evento) => setTelefone(evento.target.value)}
              required
            />
          </label>

          <button type="submit">Cadastrar cliente</button>
        </form>

        {mensagem && <p role="status">{mensagem}</p>}
        {erro && <p role="alert">{erro}</p>}
      </section>

      <section>
        <h2>Clientes</h2>

        {clientes.length === 0 && <p>Nenhum cliente cadastrado.</p>}

        {clientes.length > 0 && (
          <ul>
            {clientes.map((cliente) => (
              <li key={cliente.id}>
                {cliente.nome} — {cliente.telefone}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
  <h2>Cadastrar serviço</h2>

  <form onSubmit={cadastrarServico}>
    <label>
      Nome
      <input
        value={nomeServico}
        onChange={(evento) => setNomeServico(evento.target.value)}
        required
      />
    </label>

    <label>
      Descrição
      <input
        value={descricaoServico}
        onChange={(evento) => setDescricaoServico(evento.target.value)}
      />
    </label>

    <label>
      Duração em minutos
      <input
        type="number"
        min="1"
        step="1"
        value={duracaoMinutos}
        onChange={(evento) => setDuracaoMinutos(evento.target.value)}
        required
      />
    </label>

    <label>
      Preço
      <input
        type="number"
        min="0"
        step="0.01"
        value={preco}
        onChange={(evento) => setPreco(evento.target.value)}
        required
      />
    </label>

    <button type="submit">Cadastrar serviço</button>
  </form>

  {mensagemServico && <p role="status">{mensagemServico}</p>}
  {erroServicos && <p role="alert">{erroServicos}</p>}

  <h2>Serviços cadastrados</h2>

  {servicos.length === 0 && <p>Nenhum serviço cadastrado.</p>}

  {servicos.length > 0 && (
    <ul>
      {servicos.map((servico) => (
        <li key={servico.id}>
          {servico.nome} — {servico.duracaoMinutos} minutos — R$ {servico.preco}
        </li>
      ))}
    </ul>
  )}
</section>

<h2>Novo agendamento</h2>

<form onSubmit={cadastrarAgendamento}>
  <label>
    Cliente
    <select
      value={clienteId}
      onChange={(evento) => setClienteId(evento.target.value)}
      required
    >
      <option value="">Selecione um cliente</option>
      {clientes.map((cliente) => (
        <option key={cliente.id} value={cliente.id}>
          {cliente.nome}
        </option>
      ))}
    </select>
  </label>

  <label>
    Serviço
    <select
      value={servicoId}
      onChange={(evento) => setServicoId(evento.target.value)}
      required
    >
      <option value="">Selecione um serviço</option>
      {servicos
        .filter((servico) => servico.ativo)
        .map((servico) => (
          <option key={servico.id} value={servico.id}>
            {servico.nome} — {servico.duracaoMinutos} min
          </option>
        ))}
    </select>
  </label>

  <label>
    Data e hora
    <input
      type="datetime-local"
      value={inicio}
      onChange={(evento) => setInicio(evento.target.value)}
      required
    />
  </label>

  <button type="submit">Agendar</button>
</form>

{mensagemAgendamento && <p role="status">{mensagemAgendamento}</p>}
{erroAgendamento && <p role="alert">{erroAgendamento}</p>}

    <section>

      

  <h2>Agendamentos</h2>

  <label>
  Filtrar por status
  <select
    value={filtroStatus}
    onChange={(evento) => setFiltroStatus(evento.target.value)}
  >
    <option value="TODOS">Todos</option>
    <option value="AGENDADO">Agendados</option>
    <option value="CONFIRMADO">Confirmados</option>
    <option value="CANCELADO">Cancelados</option>
    <option value="CONCLUIDO">Concluídos</option>
  </select>
</label>
  

  {erroAgendamentos && <p role="alert">{erroAgendamentos}</p>}

  {!erroAgendamentos && agendamentosFiltrados.length === 0 && (
    <p>Nenhum agendamento cadastrado.</p>
  )}

  {!erroAgendamentos && agendamentosFiltrados.length > 0 && (
    <ul>
      {agendamentosFiltrados.map((agendamento) => (
        <li key={agendamento.id}>
          {new Date(agendamento.inicio).toLocaleString("pt-BR")} —{" "}
          {agendamento.cliente.nome} — {agendamento.servico.nome} —{" "}
          {agendamento.status}
          {(agendamento.status !== "AGENDADO" ||
            agendamento.status !== "CANCELADO"  ) && (
              <button
              type="button"
              onClick={() => cancelarAgendamento(agendamento.id)}
              >
                Cancelar
              </button>
            )}
        </li>
      ))}
    </ul>
  )}
</section>
    </main>
  );
}

      

export default App;