const registerUrl = new URL('./test-register-deno.js', import.meta.url).href;

// Deno does not expose its runtime flags through process.execArgv. Publish this registration
// argument explicitly so Gallinago can forward it to child processes.
process.execArgv.push('--import', registerUrl);