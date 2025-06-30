// Мок для node-fetch
const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({
      choices: [
        {
          message: {
            content: 'Мокированный ответ от API'
          }
        }
      ]
    })
  })
);

export default mockFetch; 