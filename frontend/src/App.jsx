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
  const [proprietarioAutenticado, setProprietarioAutenticado] = useState(false);
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [emailProprietario, setEmailProprietario] = useState("");
  const [senhaProprietario, setSenhaProprietario] = useState("");
  const [nomeClienteAgendamento, setNomeClienteAgendamento] = useState("");
  const [telefoneClienteAgendamento, setTelefoneClienteAgendamento] =
    useState("");
  const [erroLogin, setErroLogin] = useState("");
  const [mensagemLogin, setMensagemLogin] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [dataAgendamento, setDataAgendamento] = useState("");
  const [horarioAgendamento, setHorarioAgendamento] = useState("");
  const [resultadoDisponibilidade, setResultadoDisponibilidade] =
    useState(null);
  const [dataMinima] = useState(() => {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  });
  const [erroAgendamento, setErroAgendamento] = useState("");
  const [mensagemAgendamento, setMensagemAgendamento] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const chaveConsultaDisponibilidade =
    dataAgendamento && servicoId ? `${dataAgendamento}:${servicoId}` : "";
  const resultadoAtual =
    resultadoDisponibilidade?.chave === chaveConsultaDisponibilidade
      ? resultadoDisponibilidade
      : null;
  const horariosDisponiveis = resultadoAtual?.horarios ?? [];
  const erroDisponibilidade = resultadoAtual?.erro ?? "";
  const carregandoHorarios =
    Boolean(chaveConsultaDisponibilidade) && resultadoAtual === null;

  useEffect(() => {
    fetch("/api/auth/sessao")
      .then((resposta) => {
        if (resposta.ok) {
          setProprietarioAutenticado(true);
        }
      })
      .catch(() => setErroLogin("Não foi possível verificar sua sessão."))
      .finally(() => setVerificandoSessao(false));
  }, []);

  useEffect(() => {
    if (!proprietarioAutenticado) {
      return;
    }

    fetch("/api/clientes")
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error("Não foi possível carregar os clientes.");
        }

        return resposta.json();
      })
      .then((dados) => setClientes(dados))
      .catch(() => setErro("Não foi possível carregar os clientes."));
  }, [proprietarioAutenticado]);

  useEffect(() => {
    if (verificandoSessao) {
      return;
    }

    const rotaServicos = proprietarioAutenticado
      ? "/api/servicos/gerenciamento"
      : "/api/servicos";

    fetch(rotaServicos)
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
  }, [proprietarioAutenticado, verificandoSessao]);

  useEffect(() => {
    if (!dataAgendamento || !servicoId) {
      return;
    }

    const controlador = new AbortController();
    const chave = `${dataAgendamento}:${servicoId}`;
    const parametros = new URLSearchParams({
      data: dataAgendamento,
      servicoId,
    });

    fetch(`/api/disponibilidade?${parametros}`, {
      signal: controlador.signal,
    })
      .then(async (resposta) => {
        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(dados.error || "Não foi possível consultar horários.");
        }

        return dados;
      })
      .then((dados) => {
        if (!controlador.signal.aborted) {
          setResultadoDisponibilidade({
            chave,
            horarios: dados.horarios,
            erro: "",
          });
        }
      })
      .catch((erroConsulta) => {
        if (erroConsulta.name !== "AbortError") {
          setResultadoDisponibilidade({
            chave,
            horarios: [],
            erro: erroConsulta.message,
          });
        }
      });

    return () => controlador.abort();
  }, [dataAgendamento, servicoId]);

  useEffect(() => {
    if (!proprietarioAutenticado) {
      return;
    }

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
}, [proprietarioAutenticado]);

  async function entrarNoPainel(evento) {
    evento.preventDefault();
    setErroLogin("");
    setMensagemLogin("");

    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailProprietario, senha: senhaProprietario }),
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.error || "Não foi possível entrar no painel.");
      }

      setProprietarioAutenticado(true);
      setEmailProprietario("");
      setSenhaProprietario("");
      setMensagemLogin("Acesso do proprietário autenticado.");
    } catch (erroEnvio) {
      setErroLogin(erroEnvio.message);
    }
  }

  async function sairDoPainel() {
    await fetch("/api/auth/logout", { method: "POST" });
    setProprietarioAutenticado(false);
    setClientes([]);
    setAgendamentos([]);
    setMensagemLogin("Você saiu do painel.");
  }

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

    async function editarCliente(cliente) {
  const nome = window.prompt("Nome do cliente:", cliente.nome);

  if (nome === null) {
    return;
  }

  const telefone = window.prompt("Telefone do cliente:", cliente.telefone);

  if (telefone === null) {
    return;
  }

  setErro("");
  setMensagem("");

  try {
    const resposta = await fetch(`/api/clientes/${cliente.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nome, telefone }),
    });

    const clienteAtualizado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        clienteAtualizado.error || "Não foi possível atualizar o cliente."
      );
    }

    setClientes((listaAtual) =>
      listaAtual.map((item) =>
        item.id === cliente.id ? clienteAtualizado : item
      )
    );
    setMensagem("Cliente atualizado com sucesso.");
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

  async function atualizarAtivoServico(servico) {
    setErroServicos("");
    setMensagemServico("");

    try {
      const resposta = await fetch(`/api/servicos/${servico.id}/ativo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !servico.ativo }),
      });
      const servicoAtualizado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          servicoAtualizado.error || "Não foi possível atualizar o serviço."
        );
      }

      setServicos((listaAtual) =>
        listaAtual.map((item) =>
          item.id === servico.id ? servicoAtualizado : item
        )
      );
      setMensagemServico(
        servicoAtualizado.ativo
          ? "Serviço reativado e disponível para novas reservas."
          : "Serviço desativado; ele permanece no histórico."
      );
    } catch (erroEnvio) {
      setErroServicos(erroEnvio.message);
    }
  }

    async function cadastrarAgendamento(evento) {
  evento.preventDefault();
  setErroAgendamento("");
  setMensagemAgendamento("");

  try {
      const resposta = await fetch("/api/agendamentos/publico", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inicio: new Date(
          `${dataAgendamento}T${horarioAgendamento}:00`
        ).toISOString(),
        nome: nomeClienteAgendamento,
        telefone: telefoneClienteAgendamento,
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
    setNomeClienteAgendamento("");
    setTelefoneClienteAgendamento("");
    setServicoId("");
    setDataAgendamento("");
    setHorarioAgendamento("");
    setMensagemAgendamento("Agendamento criado com sucesso.");
  } catch (erroEnvio) {
    setErroAgendamento(erroEnvio.message);
  }
}

    async function atualizarStatusAgendamento(id, novoStatus) {
  setErroAgendamento("");
  setMensagemAgendamento("");

  try {
    const resposta = await fetch(`/api/agendamentos/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: novoStatus }),
    });

    const atualizado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(atualizado.error || "Não foi possível atualizar.");
    }

    setAgendamentos((listaAtual) =>
      listaAtual.map((item) => (item.id === id ? atualizado : item))
    );
    setMensagemAgendamento(`Status atualizado para ${novoStatus}.`);
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

      {!proprietarioAutenticado && (
        <section>
          <h2>Área do proprietário</h2>
          {verificandoSessao ? (
            <p>Verificando sessão...</p>
          ) : (
            <form onSubmit={entrarNoPainel}>
              <label>
                E-mail
                <input
                  type="email"
                  value={emailProprietario}
                  onChange={(evento) => setEmailProprietario(evento.target.value)}
                  autoComplete="username"
                  required
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  value={senhaProprietario}
                  onChange={(evento) => setSenhaProprietario(evento.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              <button type="submit">Entrar no painel</button>
            </form>
          )}
          {erroLogin && <p role="alert">{erroLogin}</p>}
          {mensagemLogin && <p role="status">{mensagemLogin}</p>}
        </section>
      )}

      {proprietarioAutenticado && (
        <section>
          <h2>Painel do proprietário</h2>
          <button type="button" onClick={sairDoPainel}>
            Sair
          </button>
          {mensagemLogin && <p role="status">{mensagemLogin}</p>}
        </section>
      )}

      {proprietarioAutenticado && (
        <>
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
                <button
                  type="button"
                  onClick={() => editarCliente(cliente)}
                >
                  Editar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
        </>
      )}

      {proprietarioAutenticado && (
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
          {servico.nome} — {servico.duracaoMinutos} minutos — R$ {servico.preco} — {servico.ativo ? "Ativo" : "Inativo"}
          <button
            type="button"
            onClick={() => atualizarAtivoServico(servico)}
          >
            {servico.ativo ? "Desativar" : "Reativar"}
          </button>
        </li>
      ))}
    </ul>
  )}
</section>
      )}

      {!proprietarioAutenticado && (
        <section>
          <h2>Serviços disponíveis</h2>
          {servicos.filter((servico) => servico.ativo).length === 0 ? (
            <p>Nenhum serviço disponível no momento.</p>
          ) : (
            <ul>
              {servicos
                .filter((servico) => servico.ativo)
                .map((servico) => (
                  <li key={servico.id}>
                    {servico.nome} — {servico.duracaoMinutos} minutos — R$ {servico.preco}
                  </li>
                ))}
            </ul>
          )}
        </section>
      )}

      <section>
<h2>Novo agendamento</h2>

<form onSubmit={cadastrarAgendamento}>
  <label>
    Seu nome
    <input
      value={nomeClienteAgendamento}
      onChange={(evento) => setNomeClienteAgendamento(evento.target.value)}
      required
    />
  </label>

  <label>
    Seu telefone
    <input
      type="tel"
      value={telefoneClienteAgendamento}
      onChange={(evento) =>
        setTelefoneClienteAgendamento(evento.target.value)
      }
      required
    />
  </label>

  <label>
    Serviço
    <select
      value={servicoId}
      onChange={(evento) => {
        setServicoId(evento.target.value);
        setHorarioAgendamento("");
      }}
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
      type="date"
      value={dataAgendamento}
      onChange={(evento) => {
        setDataAgendamento(evento.target.value);
        setHorarioAgendamento("");
      }}
      min={dataMinima}
      required
    />
  </label>

  <label>
    Horário disponível
    <select
      value={horarioAgendamento}
      onChange={(evento) => setHorarioAgendamento(evento.target.value)}
      required
      disabled={!dataAgendamento || !servicoId || carregandoHorarios}
    >
      <option value="">
        {carregandoHorarios && dataAgendamento && servicoId
          ? "Consultando horários..."
          : "Selecione um horário"}
      </option>
      {horariosDisponiveis.map((horario) => (
        <option key={horario} value={horario}>
          {horario}
        </option>
      ))}
    </select>
  </label>

  {dataAgendamento && servicoId && erroDisponibilidade && (
    <p role="alert">{erroDisponibilidade}</p>
  )}
  {!carregandoHorarios &&
    dataAgendamento &&
    servicoId &&
    !erroDisponibilidade &&
    horariosDisponiveis.length === 0 && (
      <p>Não há horários disponíveis nessa data.</p>
    )}

  <button type="submit">Agendar</button>
</form>

{mensagemAgendamento && <p role="status">{mensagemAgendamento}</p>}
{erroAgendamento && <p role="alert">{erroAgendamento}</p>}
      </section>

      {proprietarioAutenticado && (
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
          {agendamento.status === "AGENDADO" && (
              <button
                type="button"
                onClick={() =>
                  atualizarStatusAgendamento(agendamento.id, "CONFIRMADO")
                }
              >
                Confirmar
              </button>
            )}
            {agendamento.status === "CONFIRMADO" && (
              <button
                type="button"
                onClick={() =>
                  atualizarStatusAgendamento(agendamento.id, "CONCLUIDO")
                }
              >
                Concluir
              </button>
            )}
          {(agendamento.status === "AGENDADO" ||
            agendamento.status === "CONFIRMADO"  ) && (
              <button
              type="button"
              onClick={() => atualizarStatusAgendamento(agendamento.id, "CANCELADO")}
              >
                Cancelar
              </button>
            )}
        </li>
      ))}
    </ul>
  )}
</section>
      )}
    </main>
  );
}

      

export default App;
