from flask import Flask, render_template, request, jsonify
from scraper import pesquisar_filtro, buscar_imagem

app = Flask(__name__)


@app.route("/", methods=["GET"])
def index():
    codigo = request.args.get("codigo", "").strip()
    resultado = None
    erro = None

    if codigo:
        try:
            resultado = pesquisar_filtro(codigo)
            if resultado is None:
                erro = f'Nenhum filtro encontrado para o código "{codigo}".'
        except Exception:
            erro = "Erro ao consultar o site da Showlub. Tente novamente."

    return render_template("index.html", codigo=codigo, resultado=resultado, erro=erro)


@app.route("/api/imagem", methods=["GET"])
def api_imagem():
    codigo = request.args.get("codigo", "").strip()
    if not codigo:
        return jsonify({"erro": "Código não informado"}), 400

    try:
        info = buscar_imagem(codigo)
    except Exception:
        return jsonify({"erro": "Erro ao consultar o site da Showlub."}), 502

    if info is None or not info.get("imagem"):
        return jsonify({"erro": f'Imagem não encontrada para "{codigo}".'}), 404

    return jsonify(info)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
