import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const NOME_COOKIE_SESSAO = "agendafacil_sessao";

const duracaoSessaoMs = 8 * 60 * 60 * 1000;
const sessoes = new Map();
const tentativasLogin = new Map();
const janelaTentativaMs = 15 * 60 * 1000;

function compararSegredo(recebido, esperado) {
  const hashRecebido = createHash("sha256").update(recebido).digest();
  const hashEsperado = createHash("sha256").update(esperado).digest();

  return timingSafeEqual(hashRecebido, hashEsperado);
}

export function proprietarioConfigurado() {
  return Boolean(process.env.OWNER_EMAIL && process.env.OWNER_PASSWORD);
}

export function credenciaisDoProprietarioSaoValidas(email, senha) {
  if (!proprietarioConfigurado()) {
    return false;
  }

  const emailValido = compararSegredo(
    email.trim().toLowerCase(),
    process.env.OWNER_EMAIL.trim().toLowerCase()
  );
  const senhaValida = compararSegredo(senha, process.env.OWNER_PASSWORD);

  return emailValido && senhaValida;
}

export function criarSessao() {
  const agora = Date.now();

  for (const [id, sessao] of sessoes) {
    if (sessao.expiraEm <= agora) {
      sessoes.delete(id);
    }
  }

  const id = randomBytes(32).toString("hex");
  sessoes.set(id, { expiraEm: agora + duracaoSessaoMs });
  return id;
}

export function sessaoValida(id) {
  if (!id) {
    return false;
  }

  const sessao = sessoes.get(id);

  if (!sessao || sessao.expiraEm <= Date.now()) {
    sessoes.delete(id);
    return false;
  }

  return true;
}

export function encerrarSessao(id) {
  if (id) {
    sessoes.delete(id);
  }
}

export function loginBloqueado(ip) {
  const tentativa = tentativasLogin.get(ip);

  if (!tentativa || tentativa.bloqueadoAte <= Date.now()) {
    if (tentativa?.bloqueadoAte) {
      tentativasLogin.delete(ip);
    }

    return false;
  }

  return true;
}

export function registrarFalhaLogin(ip) {
  const agora = Date.now();

  for (const [endereco, tentativa] of tentativasLogin) {
    const expiraEm = tentativa.bloqueadoAte || tentativa.iniciadaEm + janelaTentativaMs;

    if (expiraEm <= agora) {
      tentativasLogin.delete(endereco);
    }
  }

  const existente = tentativasLogin.get(ip);
  const tentativa =
    existente && agora - existente.iniciadaEm < janelaTentativaMs
      ? existente
      : { quantidade: 0, iniciadaEm: agora, bloqueadoAte: 0 };

  tentativa.quantidade += 1;

  if (tentativa.quantidade >= 5) {
    tentativa.bloqueadoAte = agora + janelaTentativaMs;
  }

  tentativasLogin.set(ip, tentativa);
}

export function limparFalhasLogin(ip) {
  tentativasLogin.delete(ip);
}

export function lerCookie(req, nome) {
  const cookie = req.headers.cookie
    ?.split(";")
    .map((parte) => parte.trim())
    .find((parte) => parte.startsWith(`${nome}=`));

  if (!cookie) {
    return "";
  }

  try {
    return decodeURIComponent(cookie.slice(nome.length + 1));
  } catch {
    return "";
  }
}

export function cookieDeSessao(id, ambiente = process.env.NODE_ENV) {
  const atributos = [
    `${NOME_COOKIE_SESSAO}=${encodeURIComponent(id)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${duracaoSessaoMs / 1000}`,
  ];

  if (ambiente === "production") {
    atributos.push("Secure");
  }

  return atributos.join("; ");
}

export function cookieParaEncerrarSessao(ambiente = process.env.NODE_ENV) {
  const atributos = [
    `${NOME_COOKIE_SESSAO}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0",
  ];

  if (ambiente === "production") {
    atributos.push("Secure");
  }

  return atributos.join("; ");
}

export function autenticarProprietario(req, res, next) {
  const origemPermitida = process.env.APP_ORIGIN;
  const origemRecebida = req.get("origin");

  if (
    origemPermitida &&
    origemRecebida &&
    origemRecebida !== origemPermitida
  ) {
    return res.status(403).json({ error: "Origem não permitida." });
  }

  const idSessao = lerCookie(req, NOME_COOKIE_SESSAO);

  if (!sessaoValida(idSessao)) {
    return res.status(401).json({ error: "Autenticação necessária." });
  }

  req.idSessao = idSessao;
  next();
}
