import axios from 'axios';

export async function baixarArquivoANEEL(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return response.data;
}
