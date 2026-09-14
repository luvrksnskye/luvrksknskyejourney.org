

document.querySelector('.skye-copy-button').addEventListener('click', function() {
        const codeText = document.querySelector('.skye-code-block code').textContent;
        navigator.clipboard.writeText(codeText).then(function() {
        const button = document.querySelector('.skye-copy-button');
        button.textContent = 'Copied!';
        setTimeout(() => {
        button.textContent = 'Copy';
        }, 2000);                           
        });
        });
