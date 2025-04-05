function rate(stars) {
    let allStars = document.querySelectorAll(".stars i");
    allStars.forEach((star, index) => {
        if (index < stars) {
            star.classList.add("active");
        } else {
            star.classList.remove("active");
        }
    });
}