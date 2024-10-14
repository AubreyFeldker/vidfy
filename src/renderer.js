const btn = document.getElementById('btn');
const filePathElement = document.getElementById('filePath');

btn.addEventListener('click', async () => {
    const filePath = await window.electronAPI.openFile();
    filePathElement.innerText = filePath;
});

const uploadToggle = document.querySelector('#uploadBarToggle');

uploadToggle.addEventListener('click', async () => {
    const uploadBar = document.querySelector('#uploadBarContents');
    uploadBar.className = ((uploadBar.className ?? "opened") === "opened") ? "closed" : "opened";
});

/* const vidBox = document.querySelector('#videoResults');

let text = "";
for (let i = 0; i < 40; i++)
    text += "<p>text</p>";

vidBox.innerHTML = text; */