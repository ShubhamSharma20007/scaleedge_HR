function deleteUser(userId) {
    swal({
        title: "Are you sure?",
        text: "Once deleted, you will not be able to recover this user!",
        icon: "warning",
        buttons: ["Cancel", "Delete"],
        dangerMode: true,
    }).then((willDelete) => {
        if (willDelete) {
            window.location.href = "/delete/" + userId;
        }
    });
}

const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', function () {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const rows = document.querySelectorAll('#userDataTable tbody tr');
    rows.forEach(row => {
        const nameCell = row.querySelector('td:nth-child(3)');
        const emailCell = row.querySelector('td:nth-child(4)');
        const mobileCell = row.querySelector('td:nth-child(5)');
        const userGroupCell = row.querySelector('td:nth-child(6)');

        const name = nameCell.textContent.trim().toLowerCase();
        const email = emailCell.textContent.trim().toLowerCase();
        const mobile = mobileCell.textContent.trim().toLowerCase();
        const userGroup = userGroupCell.textContent.trim().toLowerCase();

        if (
            name.includes(searchTerm) ||
            email.includes(searchTerm) ||
            mobile.includes(searchTerm) ||
            userGroup.includes(searchTerm)
        ) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

