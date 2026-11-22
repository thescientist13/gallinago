async function runWithRejection() {
  return Promise.reject('Error: Child process throwing a Promise.reject to the parent.');
}

(async function() {
  await runWithRejection();
})();