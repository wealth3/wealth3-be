const spawn = require('child_process').spawn;

var child = spawn('./deposit', 
    [
        '--language=English', 
        'new-mnemonic', 
        '--mnemonic_language=english', 
        '--num_validators=1', 
        '--chain=goerli', 
        '--keystore_password=testtest'
    ],
    {
        stdio: 'inherit'
    }
);

// Continue the process automatically...
// NTH: 
// - Automatic saving of mnemonic phrase.
// - Random password being saved on the BE.

// child.stdout.on('data', function(data) {
//     console.log('stdout: ' + data);
// });