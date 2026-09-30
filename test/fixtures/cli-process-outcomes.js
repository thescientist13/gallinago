switch (process.argv[2]) {
  case 'exit-without-stderr':
    process.stdout.write('last stdout\n');
    process.exitCode = 7;
    break;
  case 'warning-success':
    process.stderr.write('routine warning\n');
    process.stdout.write('ok\n');
    break;
  case 'separate-streams':
    process.stdout.write('useful output\n');
    process.stderr.write('incidental warning\n');
    process.exitCode = 9;
    break;
  case 'large-output':
    process.stdout.write('x'.repeat(70 * 1024) + 'stdout tail\n');
    process.stderr.write('y'.repeat(70 * 1024) + 'stderr tail\n');
    process.exitCode = 2;
    break;
  case 'wait-for-signal':
    process.stdout.write('ready\n');
    setInterval(() => {}, 1000);
    break;
  default:
    throw new Error('Unknown test mode');
}
