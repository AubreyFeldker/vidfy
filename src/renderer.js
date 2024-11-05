const btn = document.querySelector('#uploadButton');
const filePathElement = document.querySelector('#filePath');

btn.addEventListener('click', async () => {
    console.log((await window.electronAPI.openFile()).data);
    //filePathElement.innerText = filePath ?? "";
});

const uploadToggle = document.querySelector('#uploadBarToggle');

uploadToggle.addEventListener('click', async () => {
    const uploadBar = document.querySelector('#uploadBarContents');
    uploadBar.className = ((uploadBar.className ?? "closed") === "opened") ? "closed" : "opened";
});

const searchButton = document.querySelector('#searchButton');
const searchInput = document.querySelector('#searchInput');

searchButton.addEventListener('click', async () => {
    const response = await window.electronAPI.makeRequest("http://localhost:5000");
});

const fileInput = document.getElementById('fileInput');

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0]; 
  console.log(event.target);
  if (file) {
    window.electronAPI.uploadFile(file);
  }
});