const socket = io();

document.getElementById('add-points').addEventListener('click', function() {
    const teamName = document.getElementById('team-name').value.trim();
    const teamPoints = parseInt(document.getElementById('team-points').value.trim());

    if (teamName && !isNaN(teamPoints)) {
        socket.emit('addPoints', { teamName, points: teamPoints });
        document.getElementById('team-name').value = '';
        document.getElementById('team-points').value = '';
    }
});

socket.on('updateScoreboard', (teams) => {
    const scoreboardBody = document.getElementById('scoreboard-body');
    scoreboardBody.innerHTML = '';
    teams.forEach(team => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${team.name}</td><td>${team.points}</td>`;
        scoreboardBody.appendChild(row);
    });
});

// Function to search for teams
function searchTeam() {
    const input = document.getElementById('search-team').value.toLowerCase();
    const rows = document.querySelectorAll('#scoreboard-body tr');

    rows.forEach(row => {
        const teamName = row.cells[0].textContent.toLowerCase();
        if (teamName.includes(input)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}