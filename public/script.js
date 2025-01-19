document.getElementById('course-form').addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const courseInput = document.getElementById('course-input').value;
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = 'Searching...';
  
    try {
      const response = await fetch(`/search?course=${courseInput}`);
      const data = await response.json();
  
      if (response.ok) {
        let html = `<h2>Results for ${data.course}:</h2>`;
        if (Object.keys(data.freeSections).length > 0) {
          html += '<ul>';
          for (const [section, time] of Object.entries(data.freeSections)) {
            html += `<li>Section ${section}: ${time}</li>`;
          }
          html += '</ul>';
        } else {
          html += '<p>No free sections available.</p>';
        }
        resultsDiv.innerHTML = html;
      } else {
        resultsDiv.innerHTML = `<p class="error">${data.error}</p>`;
      }
    } catch (err) {
      resultsDiv.innerHTML = `<p class="error">An error occurred while fetching the data.</p>`;
    }
  });
  