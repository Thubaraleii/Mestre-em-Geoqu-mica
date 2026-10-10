it('jsdom disponivel', () => {
  expect(document.createElementNS('http://www.w3.org/2000/svg', 'svg')).toBeTruthy();
});
