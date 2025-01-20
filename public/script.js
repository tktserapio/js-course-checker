const container = document.getElementById("container");
const form = document.getElementById("course-form");
const resultsDiv = document.getElementById("results");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Show the right box and adjust the container layout
  container.classList.add("search-active");
  resultsDiv.style.display = "block";
  resultsDiv.innerHTML = "Searching...";

  const courseInput = document.getElementById("course-input").value;

  try {
    const response = await fetch(`/search?course=${courseInput}`);
    const data = await response.json();

    if (response.ok) {
      let html = `<h2>Results for ${data.course}:</h2>`;
      if (Object.keys(data.freeSections).length > 0) {
        html += `
                <table>
                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
              `;
        for (const [section, time] of Object.entries(data.freeSections)) {
          html += `
                  <tr>
                    <td>${section}</td>
                    <td>${time}</td>
                  </tr>
                `;
        }
        html += `
                  </tbody>
                </table>
              `;
      } else {
        html += "<p>No free sections available.</p>";
      }
      resultsDiv.innerHTML = html;
    } else {
      // If the response is not ok, display the error from the server
      resultsDiv.innerHTML = `<p class="error">${data.error}</p>`;
    }
  } catch (err) {
    resultsDiv.innerHTML = `<p class="error">An error occurred while fetching the data.</p>`;
  }
});
