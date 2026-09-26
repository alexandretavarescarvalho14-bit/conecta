/* ══════════════════ CNPJ ══════════════════
   Compartilhado entre o protótipo e o Conectaria Vagas (montar.py).

   Dígito verificador de CNPJ, mod 11. Confirma só que o número está bem
   formado, não que a empresa existe de verdade — por isso o texto na
   tela diz "formato válido", nunca "verificado". Consulta cadastral real
   é integração que este protótipo não tem. */
function validarCNPJ(cnpj){
  const d = String(cnpj || '').replace(/\D/g, '');
  if(d.length !== 14) return false;
  if(/^(\d)\1{13}$/.test(d)) return false; // todos os dígitos iguais: formalmente inválido
  const calc = base => {
    const pesos = base.length === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
    const soma = base.split('').reduce((a, n, i) => a + (+n) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const dv1 = calc(d.slice(0, 12));
  const dv2 = calc(d.slice(0, 12) + dv1);
  return d === d.slice(0, 12) + String(dv1) + String(dv2);
}
function mascararCNPJ(v){
  const d = String(v || '').replace(/\D/g, '').slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2}\.\d{3})(\d)/, '$1.$2')
    .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
}
