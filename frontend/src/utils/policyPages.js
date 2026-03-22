const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const normalizePolicyCode = (value) => {
  const code = normalizeText(value);

  if (!code) return '';

  if (
    code === 'terms' ||
    code === 'term' ||
    code === 'terms-of-service' ||
    code === 'term-of-service' ||
    code.startsWith('term')
  ) {
    return 'terms';
  }

  if (
    code === 'privacy' ||
    code === 'privacy-policy' ||
    code.startsWith('privacy')
  ) {
    return 'privacy';
  }

  if (
    code === 'author-rules' ||
    code === 'author-rule' ||
    code === 'upload-rule' ||
    code === 'upload-rules' ||
    code.startsWith('author-rules')
  ) {
    return 'author-rules';
  }

  return code;
};

export const inferPolicyCategory = (page) => {
  const codeCategory = normalizePolicyCode(page?.code);
  if (['terms', 'privacy', 'author-rules'].includes(codeCategory)) {
    return codeCategory;
  }

  const title = normalizeText(page?.title);

  if (
    title.includes('dieu khoan') ||
    title.includes('terms of service') ||
    title.includes('term of service')
  ) {
    return 'terms';
  }

  if (title.includes('bao mat') || title.includes('privacy')) {
    return 'privacy';
  }

  if (
    title.includes('quy dinh dang truyen') ||
    title.includes('rule dang truyen') ||
    title.includes('upload rule')
  ) {
    return 'author-rules';
  }

  return '';
};

export const extractPolicyOrder = (page) => {
  const codeMatch = String(page?.code || '').match(/(\d+)/);
  if (codeMatch) return Number.parseInt(codeMatch[1], 10);

  const titleMatch = String(page?.title || '').match(/(\d+)/);
  if (titleMatch) return Number.parseInt(titleMatch[1], 10);

  return 0;
};

export const sortPolicyBlocks = (items) =>
  [...(Array.isArray(items) ? items : [])].sort(
    (a, b) => extractPolicyOrder(a) - extractPolicyOrder(b),
  );
