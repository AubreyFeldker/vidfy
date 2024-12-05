const btn = document.querySelector('#uploadButton');
const filePathElement = document.querySelector('#filePath');

btn.addEventListener('click', async () => {
    const tagsInput = document.querySelector('#tagsInput');
    const tags = tagsInput.value.split(" ");
    const uploaded = await window.electronAPI.openFile(tags);
    filePathElement.innerText = uploaded ?? "";
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
    const response = await window.electronAPI.search(tags) ?? [];
    console.log(response);

    const videoResults = document.querySelector('#videoResults');
    let videoHTML = "";

    response.forEach((video) => {
        videoHTML += `<video width="500" controls><source src="${video.location}/thumbs/${video._id}.mov" type="video/mp4"></video><p>Tags ${video.tags.join(',')} <a href="${video.location}/fulls/${video._id}.mov">Download original video.</a></p>`;
    });
    videoResults.innerHTML = videoHTML;
});