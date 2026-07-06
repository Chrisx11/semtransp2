// As Ordens de Serviço da CRISROLI (gerador Ghostscript) desenham o número
// da OS e a data/hora do cabeçalho usando uma fonte Type3 sem ToUnicode —
// texto comum não extrai esses campos. Cada glyph (0-9, "/", ":"), porém,
// é desenhado sempre com o mesmo conteúdo de CharProc byte-a-byte,
// independente do arquivo, então um hash SHA1 do CharProc identifica o
// caractere mesmo quando o código interno da fonte muda a cada PDF
// (subset gerado por arquivo). Tabela obtida por engenharia reversa e
// validada em 41 PDFs reais sem falhas.
export const DIGIT_FONT_HASH_TO_CHAR: Record<string, string> = {
  "786c8fa2e111": "0",
  "056a6d14eaf7": "1",
  "b664c5987174": "2",
  "9cbad28aae12": "3",
  "61693ba3b8f5": "4",
  "bed16ab5504f": "5",
  "bf0a537ebea6": "6",
  "e3892ae809b7": "7",
  "65c574585e16": "8",
  "b54a00f33544": "9",
  "943283b49df2": "/",
  "f9394ca13bd7": ":",
}
