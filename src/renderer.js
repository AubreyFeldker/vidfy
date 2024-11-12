const btn = document.querySelector('#uploadButton');
const filePathElement = document.querySelector('#filePath');

btn.addEventListener('click', async () => {
    const tagsInput = document.querySelector('#tagsInput');
    const tags = tagsInput.value.split(" ");
    console.log(await window.electronAPI.openFile(tags));
    //filePathElement.innerText = filePath ?? "";
});

const uploadToggle = document.querySelector('#uploadBarToggle');

uploadToggle.addEventListener('click', async () => {
    const uploadBar = document.querySelector('#uploadBarContents');
    uploadBar.className = ((uploadBar.className ?? "closed") === "opened") ? "closed" : "opened";
});


const searchButton = document.querySelector('#searchButton');

searchButton.addEventListener('click', async () => {
    const searchInput = document.querySelector('#searchInput');
    const tags = searchInput.value;
    const response = await window.electronAPI.search(tags);
    console.log(response);

    const videoResults = document.querySelector('#videoResults');
    let videoHTML = "";

    response.forEach((video) => {
        videoHTML += `<video width="500" controls><source src="${"http://localhost:5000"}/${video}.mp4" type="video/mp4"></video>`;
    });
    videoResults.innerHTML = videoHTML;
});