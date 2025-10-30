import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Image,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function JogoMemoria() {
  // --- Estados principais ---
  const [tempo, setTempo] = useState(60);
  const [jogando, setJogando] = useState(false);
  const [nivel, setNivel] = useState(1);
  const [cartas, setCartas] = useState([]);
  const [viradas, setViradas] = useState([]);
  const [combinadas, setCombinadas] = useState([]);
  const [bloqueio, setBloqueio] = useState(false);
  const [mensagem, setMensagem] = useState("Pressione Iniciar para começar!");
  const [corMensagem, setCorMensagem] = useState("#f1c40f");

  // 🆕 Estados do Menu e Progresso
  const [mostrarMenu, setMostrarMenu] = useState(true);
  const [recordes, setRecordes] = useState({});
  const [tentativas, setTentativas] = useState(0);

  // 🆕 Chaves do AsyncStorage
  const CHAVE_NIVEL = "@jogo_memoria_nivel";
  const CHAVE_RECORDES = "@jogo_memoria_recordes";
  const CHAVE_TENTATIVAS = "@jogo_memoria_tentativas";

  // 🆕 Carregar progresso salvo
  useEffect(() => {
    carregarProgresso();
  }, []);

  const carregarProgresso = async () => {
    try {
      const [nivelSalvo, recordesSalvos, tentativasSalvas] = await Promise.all([
        AsyncStorage.getItem(CHAVE_NIVEL),
        AsyncStorage.getItem(CHAVE_RECORDES),
        AsyncStorage.getItem(CHAVE_TENTATIVAS),
      ]);

      if (nivelSalvo) setNivel(parseInt(nivelSalvo));
      if (recordesSalvos) setRecordes(JSON.parse(recordesSalvos));
      if (tentativasSalvas) setTentativas(parseInt(tentativasSalvas));
    } catch (error) {
      console.log("Erro ao carregar progresso:", error);
    }
  };

  // 🆕 Salvar progresso
  const salvarProgresso = async (
    novoNivel = nivel,
    novasTentativas = tentativas
  ) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(CHAVE_NIVEL, novoNivel.toString()),
        AsyncStorage.setItem(CHAVE_TENTATIVAS, novasTentativas.toString()),
      ]);
    } catch (error) {
      console.log("Erro ao salvar progresso:", error);
    }
  };

  // 🆕 Salvar recorde
  const salvarRecorde = async (nivelRecorde, tempoRestante) => {
    try {
      const novoRecorde = {
        nivel: nivelRecorde,
        tempo: tempoRestante,
        data: new Date().toLocaleDateString("pt-BR"),
      };

      const novosRecordes = {
        ...recordes,
        [nivelRecorde]: novoRecorde,
      };

      setRecordes(novosRecordes);
      await AsyncStorage.setItem(CHAVE_RECORDES, JSON.stringify(novosRecordes));
    } catch (error) {
      console.log("Erro ao salvar recorde:", error);
    }
  };

  // 🆕 Reiniciar progresso
  const reiniciarProgresso = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CHAVE_NIVEL),
        AsyncStorage.removeItem(CHAVE_RECORDES),
        AsyncStorage.removeItem(CHAVE_TENTATIVAS),
      ]);

      setNivel(1);
      setRecordes({});
      setTentativas(0);
      setMostrarMenu(true);

      Alert.alert("✅", "Progresso reiniciado com sucesso!");
    } catch (error) {
      console.log("Erro ao reiniciar progresso:", error);
    }
  };

  function gerarCartas(nivelAtual = 1) {
    const imagens = [
      require("./assets/imagem/download.jpg"),
      require("./assets/imagem/SwordsoulSupremeSovereignChengying-OW.webp"),
      require("./assets/imagem/dcyl4hn-f800f6bc-ebaa-4857-a32d-bb0f14b21a15.png"),
      require("./assets/imagem/why-no-one-plays-dark-world-v0-n15i4ehnc4ac1.webp"),
      require("./assets/imagem/0e0583f1442702a659ca072d2dc04f6b.jpg"),
      require("./assets/imagem/20289eac001fa7c73656a56cbd227bb9.jpg"),
      require("./assets/imagem/271879cebdc08edfcec00e190fc6d157.jpg"),
      require("./assets/imagem/cfa591eeca25e61be8ab29b3fe5fe84f.jpg"),
      require("./assets/imagem/dante.jpg"),
      require("./assets/imagem/ddd.jpg"),
      require("./assets/imagem/images.jpg"),
      require("./assets/imagem/s3e88vyx0kb61.webp"),
      require("./assets/imagem/samurai.jpg"),
      require("./assets/imagem/SkyStrikerMobilizeEngage-MADU-EN-VG-artwork.png"),
      require("./assets/imagem/starvingvenon.jpg"),
      require("./assets/imagem/Foto_entidad_externa_nyarla.webp"),
      require("./assets/imagem/castel.jpg"),
    ];

    const quantidadePares = Math.min(nivelAtual + 1, imagens.length);
    const selecionadas = imagens.slice(0, quantidadePares);

    let cartasGeradas = selecionadas.flatMap((img, i) => [
      { id: `${nivelAtual}-${i}-${0}`, imagem: img, combinada: false },
      { id: `${nivelAtual}-${i}-${1}`, imagem: img, combinada: false },
    ]);

    return cartasGeradas.sort(() => Math.random() - 0.5);
  }

  // --- Sistema de Mensagens ---
  const mostrarMensagem = (texto, cor = "#f1c40f") => {
    setMensagem(texto);
    setCorMensagem(cor);
  };

  // --- Timer regressivo ---
  useEffect(() => {
    let intervalo = null;

    if (jogando && tempo > 0) {
      intervalo = setInterval(() => {
        setTempo((t) => {
          if (t <= 1) {
            handleDerrota();
            return 0;
          }

          if (t <= 10) {
            mostrarMensagem(`⏰ Pressa! ${t}s restantes!`, "#e74c3c");
          }

          return t - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [jogando]);

  // --- Função de Derrota ---
  const handleDerrota = () => {
    setJogando(false);
    setTentativas((prev) => {
      const novasTentativas = prev + 1;
      salvarProgresso(nivel, novasTentativas);
      return novasTentativas;
    });

    mostrarMensagem("⏰ Tempo esgotado! Tente novamente.", "#e74c3c");

    Alert.alert("⏰ Tempo Esgotado!", `Você não completou o nível ${nivel}.`, [
      {
        text: "Tentar Novamente",
        onPress: reiniciarNivel,
      },
      {
        text: "Voltar ao Menu",
        onPress: () => setMostrarMenu(true),
        style: "cancel",
      },
    ]);
  };

  // --- Funções de controle ---
  function iniciarNivel() {
    if (combinadas.length === cartas.length && cartas.length > 0) {
      proximoNivel();
      return;
    }

    setTempo(60);
    setJogando(true);
    setViradas([]);
    setCombinadas([]);

    const novasCartas = gerarCartas(nivel);
    setCartas(novasCartas);

    mostrarMensagem(
      `Nível ${nivel}: Encontre ${novasCartas.length / 2} pares!`,
      "#3498db"
    );
  }

  function reiniciarNivel() {
    setTempo(60);
    setViradas([]);
    setCombinadas([]);

    const novasCartas = gerarCartas(nivel);
    setCartas(novasCartas);

    setJogando(true);
    mostrarMensagem(`Recomeçando nível ${nivel}...`, "#3498db");
  }

  function proximoNivel() {
    const novoNivel = nivel + 1;

    console.log(`🚀 Avançando para nível ${novoNivel}`);

    // 🆕 Salvar recorde se for melhor tempo
    if (tempo > (recordes[nivel]?.tempo || 0)) {
      salvarRecorde(nivel, tempo);
    }

    mostrarMensagem(
      `🎉 Nível ${nivel} completo! Indo para nível ${novoNivel}...`,
      "#2ecc71"
    );

    setJogando(false);
    setViradas([]);
    setCombinadas([]);
    setNivel(novoNivel);

    // 🆕 Salvar novo nível
    salvarProgresso(novoNivel, tentativas);

    setTimeout(() => {
      const novasCartas = gerarCartas(novoNivel);
      setCartas(novasCartas);
      setTempo(60);

      mostrarMensagem(
        `Nível ${novoNivel}: Encontre ${novasCartas.length / 2} pares!`,
        "#9b59b6"
      );

      setTimeout(() => {
        setJogando(true);
      }, 1000);
    }, 1000);
  }

  // --- Verificação de Vitória ---
  function verificarVitoria() {
    if (combinadas.length === cartas.length && cartas.length > 0 && jogando) {
      console.log(`🎉 VITÓRIA no nível ${nivel}!`);

      setJogando(false);
      setTempo(0);

      mostrarMensagem(`🎉 Parabéns! Nível ${nivel} completo!`, "#2ecc71");

      setTimeout(() => {
        Alert.alert(
          "🎉 Vitória!",
          `Nível ${nivel} completo!\n\nTempo restante: ${tempo}s\n\nPróximo nível: ${
            nivel + 1
          }`,
          [
            {
              text: "Jogar Próximo Nível",
              onPress: proximoNivel,
            },
            {
              text: "Voltar ao Menu",
              onPress: () => setMostrarMenu(true),
              style: "cancel",
            },
          ]
        );
      }, 1000);
    }
  }

  // --- Função Virar Carta ---
  function virarCarta(index) {
    if (
      bloqueio ||
      viradas.includes(index) ||
      combinadas.includes(index) ||
      !jogando
    ) {
      return;
    }

    const novasViradas = [...viradas, index];
    setViradas(novasViradas);

    if (novasViradas.length === 2) {
      setBloqueio(true);

      const [primeira, segunda] = novasViradas;

      if (cartas[primeira].imagem === cartas[segunda].imagem) {
        mostrarMensagem("✅ Par encontrado!", "#2ecc71");

        const novasCombinadas = [...combinadas, primeira, segunda];
        setCombinadas(novasCombinadas);
        setViradas([]);
        setBloqueio(false);
      } else {
        mostrarMensagem("❌ Tente novamente!", "#e74c3c");

        setTimeout(() => {
          setViradas([]);
          setBloqueio(false);
          const paresRestantes = cartas.length / 2 - combinadas.length / 2;
          mostrarMensagem(
            `Encontre ${paresRestantes} ${
              paresRestantes === 1 ? "par" : "pares"
            } restantes`,
            "#f1c40f"
          );
        }, 1000);
      }
    } else {
      const paresRestantes = cartas.length / 2 - combinadas.length / 2;
      mostrarMensagem(
        `Encontre ${paresRestantes} ${paresRestantes === 1 ? "par" : "pares"}`,
        "#f1c40f"
      );
    }
  }

  // --- Função para texto do botão ---
  function getTextoBotao() {
    if (cartas.length === 0) {
      return "Iniciar Jogo";
    } else if (combinadas.length === cartas.length && cartas.length > 0) {
      return "Próximo Nível";
    } else {
      return "Jogar Novamente";
    }
  }

  // --- Verificação automática de vitória ---
  useEffect(() => {
    if (jogando && combinadas.length > 0) {
      verificarVitoria();
    }
  }, [combinadas, jogando]);

  // 🆕 Tela de Menu
  const renderMenu = () => (
    <Modal visible={mostrarMenu} animationType="slide" transparent={true}>
      <View style={styles.menuContainer}>
        <View style={styles.menuContent}>
          <Text style={styles.tituloMenu}>🎮 Jogo da Memória</Text>

          <View style={styles.infoContainer}>
            <Text style={styles.infoTexto}>Nível Atual: {nivel}</Text>
            <Text style={styles.infoTexto}>Tentativas: {tentativas}</Text>
            <Text style={styles.infoTexto}>
              Recorde Nível {nivel}:{" "}
              {recordes[nivel] ? `${recordes[nivel].tempo}s` : "Nenhum"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.menuBotao}
            onPress={() => {
              setMostrarMenu(false);
              iniciarNivel();
            }}
          >
            <Text style={styles.menuBotaoTexto}>▶️ Continuar Jogo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuBotao}
            onPress={() => {
              setNivel(1);
              setTentativas(0);
              setMostrarMenu(false);
              salvarProgresso(1, 0);
              iniciarNivel();
            }}
          >
            <Text style={styles.menuBotaoTexto}>🔄 Novo Jogo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuBotaoSecundario}
            onPress={() => {
              Alert.alert(
                "Recordes",
                Object.keys(recordes).length === 0
                  ? "Nenhum recorde ainda!"
                  : Object.entries(recordes)
                      .map(
                        ([nivel, recorde]) =>
                          `Nível ${nivel}: ${recorde.tempo}s (${recorde.data})`
                      )
                      .join("\n")
              );
            }}
          >
            <Text style={styles.menuBotaoTexto}>🏆 Ver Recordes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuBotaoSecundario}
            onPress={reiniciarProgresso}
          >
            <Text style={styles.menuBotaoTexto}>🗑️ Reiniciar Progresso</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // --- Renderização do jogo ---
  return (
    <View style={styles.container}>
      {renderMenu()}

      {/* Botão Menu durante o jogo */}
      {!mostrarMenu && (
        <TouchableOpacity
          style={styles.botaoMenu}
          onPress={() => setMostrarMenu(true)}
        >
          <Text style={styles.botaoMenuTexto}>☰</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.texto}>Nível: {nivel}</Text>
      <Text style={styles.texto}>Tempo: {tempo}s</Text>
      <Text style={styles.texto}>
        Pares: {combinadas.length / 2} / {cartas.length / 2}
      </Text>
      <Text style={styles.texto}>Tentativas: {tentativas}</Text>

      <Text style={[styles.mensagem, { color: corMensagem }]}>{mensagem}</Text>

      <View style={styles.tabuleiro}>
        {cartas.map((carta, index) => {
          const isVirada =
            viradas.includes(index) || combinadas.includes(index);

          return (
            <TouchableOpacity
              key={`${carta.id}-${index}`}
              onPress={() => virarCarta(index)}
              disabled={!jogando}
            >
              <View
                style={[
                  styles.carta,
                  combinadas.includes(index) && styles.cartaCombinada,
                  viradas.includes(index) && styles.cartaVirada,
                ]}
              >
                {isVirada ? (
                  <Image
                    source={carta.imagem}
                    style={styles.imagemCarta}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.versoCarta}>
                    <Text style={styles.textoVerso}>?</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {!jogando && !mostrarMenu && (
        <View style={styles.botoesContainer}>
          <TouchableOpacity style={styles.botao} onPress={iniciarNivel}>
            <Text style={styles.textoBotao}>{getTextoBotao()}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// --- Estilos Atualizados ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#222",
    padding: 20,
  },
  // 🆕 Estilos do Menu
  menuContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  menuContent: {
    backgroundColor: "#333",
    padding: 30,
    borderRadius: 15,
    alignItems: "center",
    minWidth: 300,
  },
  tituloMenu: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  infoContainer: {
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: "100%",
  },
  infoTexto: {
    color: "#fff",
    fontSize: 16,
    marginVertical: 5,
    textAlign: "center",
  },
  menuBotao: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
    minWidth: 200,
    alignItems: "center",
  },
  menuBotaoSecundario: {
    backgroundColor: "#6c757d",
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    minWidth: 180,
    alignItems: "center",
  },
  menuBotaoTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  botaoMenu: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  botaoMenuTexto: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  // Estilos existentes
  texto: {
    color: "#fff",
    fontSize: 18,
    margin: 5,
  },
  mensagem: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  tabuleiro: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 400,
    marginVertical: 20,
  },
  carta: {
    width: 80,
    height: 100,
    margin: 5,
    backgroundColor: "#444",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#666",
  },
  cartaCombinada: {
    borderColor: "#4CAF50",
    backgroundColor: "#2d5a2d",
  },
  cartaVirada: {
    borderColor: "#f1c40f",
    backgroundColor: "#5a4d2d",
  },
  imagemCarta: {
    width: "90%",
    height: "90%",
    borderRadius: 6,
  },
  versoCarta: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007bff",
    borderRadius: 6,
  },
  textoVerso: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  botoesContainer: {
    marginTop: 20,
  },
  botao: {
    padding: 15,
    backgroundColor: "#007bff",
    borderRadius: 8,
    minWidth: 150,
    alignItems: "center",
  },
  textoBotao: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
