import {fetchSingleMovieData, fetchMovieRating, getReviews, fetchCmdbTopList, postReviewToAPI} from './api.js';

let cachedMovieID = null;
let imdbID = await getImdbID();
let movie = await fetchSingleMovieData(imdbID);
let movieRating = await fetchMovieRating(imdbID);
let reviews = await getReviews(imdbID);
let paginationAdded = false;
displayMovie(movie);
displayRating(movieRating);
displayReviews(reviews);

//Gets the imdbID from the current URL in browser window
async function getImdbID() {
  const url = window.location.search;
  const searchParams = new URLSearchParams(url);
  let imdbID = searchParams.get("imdbID");

  if (!imdbID) {
    imdbID = await getDefaultMovieID();
  }
  return imdbID
}

//Gets the highest ratest movie from toplist as a default movie
async function getDefaultMovieID() {

if (cachedMovieID !== null) {
  return cachedMovieID;
  }

  const fetchTopMovieParam = "toplists?sort=DESC&limit=1&page=1&countLimit=2";
  const result = await fetchCmdbTopList(fetchTopMovieParam);
  const topMovie = result[0];
  return topMovie.imdbID;

}

//Displays selected movie in UI
function displayMovie(movie) {
  const poster = document.getElementById("poster")
  const title = document.getElementById("title")
  const release = document.getElementById("release")
  const genre = document.getElementById("genre")
  const runtime = document.getElementById("runtime")
  const plot = document.getElementById("plot")
  const director = document.getElementById("director")
  const actors = document.getElementById("actors")
  const imdbRating = document.getElementById("imdb-rating")

  poster.src = (movie.poster === 'N/A') ? './img/no-poster.jpg' : movie.poster;
  poster.alt = (movie.poster === 'N/A') ? 'Omslagsbild för film' : `Omslagsbild för: ${movie.title}`;
  title.textContent = movie.title;
  release.textContent = `Utgiven: ${movie.release}`;
  genre.textContent = `Genre: ${movie.genre}`;
  runtime.textContent = `Spellängd: ${movie.runtime}`;
  plot.textContent = `Handling: ${movie.plot}`;
  director.textContent = `Filmregissör: ${movie.director}`;
  actors.textContent = `Skådespelare: ${movie.actors}`;
  imdbRating.textContent = `IMDb rating: ${movie.imdbRating}`;
}

//Displays rating from Cmdb in UI
function displayRating(movieRating) {
  const cmdbScore = document.getElementById("cmdb-score")
  const ratingCount = document.getElementById("rating-count")
  const categorizedScores = document.getElementById("categorized-scores")

  cmdbScore.textContent = `Cineasternas betyg: ${movieRating.cmdbScore ? movieRating.cmdbScore : "Ingen har betygsatt ännu."}`;
  ratingCount.textContent = movieRating.ratingCount ? `Totalt antal som betygsatt: ${movieRating.ratingCount}` : 'Recensera och betygsätt längre ned på sidan!';

  const possibleScores = [1, 2, 3, 4];
  if (movieRating.categorizedScores) {
    categorizedScores.innerHTML = 'Betygsfördelning:';
    possibleScores.forEach((score) => {
      const scoreData = movieRating.categorizedScores.find((item) => item.score === score);
      const scoreElement = document.createElement('i');
      scoreElement.textContent = `- ${scoreData ? scoreData.count : 0} stycken: ${score} poäng`;
      categorizedScores.appendChild(scoreElement);
    });
  }
}

//Updates ratings in UI after user has rated
async function updateMovieRating(imdbID) {
  let movieRating = await fetchMovieRating(imdbID);

  displayRating(movieRating)
}

//Visually confirms which rating button is clicked
const buttons = document.querySelectorAll('.buttons button');
buttons.forEach((button) => {
  button.addEventListener('click', (event) => {
      event.preventDefault();
      buttons.forEach((btn) => {
          btn.classList.remove('clicked');
      });
      button.classList.add('clicked');
  });
});

//Handles users input in UI form for submit of review
const submitReviewButton = document.getElementById('submit-review');
submitReviewButton.addEventListener('click', function (event) {
  event.preventDefault();

  const author = document.getElementById("name").value;
  const review = document.getElementById("review").value;

  if (typeof author !== "string" || author.trim().length === 0) {
    alert(`Fältet "Namn" får inte vara tomt. Fyll i ditt namn!`);
    document.getElementById("name").focus();
    return;
  }
  if (typeof review !== "string" || review.trim().length === 0) {
    alert(`Fältet "Recension" får inte vara tomt. Skriv en recension!`);
    document.getElementById("review").focus();
    return;
  }
  postReview(imdbID, author, review);
});

//Checks is cookie exists confirming user has already reviewed movie, disabling review buttons if true
if (hasSubmittedReview(imdbID)) {
  const buttons = document.querySelectorAll(".buttons button");
  buttons.forEach((button) => {
    button.classList.remove('clicked');
    button.disabled = true;
    button.style.opacity = 0.2;
    button.style.cursor = 'default';
  });
  const submitButton = document.getElementById("submit-review");
  submitButton.disabled = true;
  submitButton.style.opacity = 0.2;
  submitButton.style.cursor = 'default';

  const nameInput = document.getElementById("name");
  const reviewInput = document.getElementById("review");
  nameInput.setAttribute("disabled", true);
  reviewInput.setAttribute("disabled", true);
}

// Funktion för att posta recensionen
async function postReview(imdbID, author, review) {

  let selectedScore = null;
  const clickedButton = document.querySelector('.buttons button.clicked');
  if (clickedButton) {
    selectedScore = parseInt(clickedButton.getAttribute('data-score'));
  } else {
    console.log('Inget betyg är valt');
    alert("Välj ett betyg!");
    return;
  }

  let reviewDto = {
    "imdbID": imdbID,
    "reviewer": author,
    "score": selectedScore,
    "review": review,
  };

  const reviewPosted = await postReviewToAPI(reviewDto);

  if (reviewPosted) {
    setReviewedCookie(imdbID);
    updateAfterReview();
    await updateMovieRating(imdbID);
    let reviews = await getReviews(imdbID);
    displayReviews(reviews);
  }
}

//Gives user feedback during input of review text.
const reviewTextarea = document.getElementById('review');
const charCount = document.getElementById('char-count');
const maxChars = 150;

reviewTextarea.addEventListener('input', function () {
  const currentChars = reviewTextarea.value.length;
  const remainingChars = maxChars - currentChars;

  if (remainingChars >= 0) {
    charCount.textContent = `Antal tecken kvar: ${remainingChars}`;
  } else {
    reviewTextarea.value = reviewInput.value.slice(0, maxChars);
  }
});

//Handles UI for displaying of reviews
function displayReviews(reviews) {
  const reviewsContainer = document.querySelector(".reviews-container");

  while (reviewsContainer.childElementCount > 0) {
    reviewsContainer.removeChild(reviewsContainer.lastChild);
  }

  if (reviews.length === 0) {
    const noReviewsMessage = document.createElement('p');
    noReviewsMessage.textContent = 'Bli först att recensera och betygsätta!';
    reviewsContainer.appendChild(noReviewsMessage);
  } else {
    reviews.sort((a, b) => new Date(a.date) - new Date(b.date));
    reviews.reverse();

    let reviewCount = reviews.length;
    const reviewsHeader = document.getElementById('reviews-header');
    reviewsHeader.textContent = `Recensioner (${reviewCount} stycken):`;

    displayPageofReviews(reviews.slice(0, 3));

    const paginationContainer = document.querySelector('.pagination');
    const buttonContainer = document.createElement('div');

    if(reviews.length > 4 && !paginationAdded) {
      const prevPageButton = document.createElement('button');
      const nextPageButton = document.createElement('button');
      prevPageButton.id = 'prevPage';
      nextPageButton.id = 'nextPage';
      prevPageButton.textContent = 'Föregående';
      nextPageButton.textContent = 'Nästa';

      const textPaging = document.createElement('p');
      paginationContainer.appendChild(textPaging);
    
      let currentPage = 1;
      let pageLength = 3;
      let start = currentPage-1
      let end = currentPage * pageLength

      if (currentPage = 1) {
        prevPageButton.disabled = true;
        prevPageButton.style.opacity = 0.2;
      }
    
      prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          start = (currentPage - 1) * pageLength;
          end = currentPage * pageLength;
          displayPageofReviews(reviews.slice(start, end));
          textPaging.textContent = `Sida ${currentPage} av ${Math.ceil(reviews.length / 3)}`;

          nextPageButton.disabled = false;
          nextPageButton.style.opacity = 1;
        }
        if (currentPage === 1) {
          prevPageButton.disabled = true;
          prevPageButton.style.opacity = 0.2;
        }
      });
    
      nextPageButton.addEventListener('click', () => {
        if (currentPage < Math.ceil(reviews.length / 3)) {
          currentPage++;
          start = (currentPage - 1) * pageLength;
          end = currentPage * pageLength;
          displayPageofReviews(reviews.slice(start, end));
          textPaging.textContent = `Sida ${currentPage} av ${Math.ceil(reviews.length / 3)}`;
        }
        if (currentPage === Math.ceil(reviews.length / 3)) {
          nextPageButton.disabled = true;
          nextPageButton.style.opacity = 0.2;
        }
        if (currentPage > 1)
        {
          prevPageButton.disabled = false;
          prevPageButton.style.opacity = 1;
        }
      });
      
      textPaging.textContent = `Sida ${currentPage} av ${Math.ceil(reviews.length / 3)}`;
      buttonContainer.appendChild(prevPageButton);
      buttonContainer.appendChild(nextPageButton);
      paginationContainer.appendChild(buttonContainer);
      paginationContainer.appendChild(textPaging);
      paginationAdded = true;
    }
  }
}

//Creates and displays HTML-elements for each subset of 3 from reviews array
function displayPageofReviews(reviews) {
  const reviewsContainer = document.querySelector(".reviews-container");

  while (reviewsContainer.childElementCount > 0) {
    reviewsContainer.removeChild(reviewsContainer.lastChild);
  }

  reviews.forEach(review => {
    const reviewContainer = document.createElement('div');
    const authorElement = document.createElement('p');
    const dateElement = document.createElement('p');
    const ratingElement = document.createElement('p');
    const reviewElement = document.createElement('p');

    authorElement.textContent = `Cineast: ${review.author}`;
    dateElement.textContent = `Datum: ${review.date}`;
    ratingElement.textContent = `Betyg: ${review.score}`;
    reviewElement.textContent = `Recension: ${review.review}`;

    reviewContainer.appendChild(authorElement);
    reviewContainer.appendChild(dateElement);
    reviewContainer.appendChild(ratingElement);
    reviewContainer.appendChild(reviewElement);
    reviewsContainer.appendChild(reviewContainer);
    reviewContainer.classList.add('review-design');
  });
}

//Updates UI after successfully posted review
function updateAfterReview() {
  const nameInput = document.getElementById("name");
  const reviewInput = document.getElementById("review");
  const charCount = document.getElementById('char-count')
  nameInput.value = "";
  reviewInput.value = "";
  nameInput.setAttribute("disabled", true);
  reviewInput.setAttribute("disabled", true);
  charCount.textContent = 'Antal tecken kvar: 150';

  if (hasSubmittedReview(imdbID)) {
    const buttons = document.querySelectorAll(".buttons button");
    buttons.forEach((button) => {
      button.classList.remove('clicked');
      button.disabled = true;
      button.style.opacity = 0.2;
      button.style.cursor = 'default';
    });

    const submitButton = document.getElementById("submit-review");
    submitButton.disabled = true;
    submitButton.style.opacity = 0.2;
    submitButton.style.cursor = 'default';
  }
}

//Sets cookie with 1 day expiry
function setReviewedCookie(imdbID) {
  const cookieName = imdbID + "_reviewed";
  const date = new Date();
  date.setTime(date.getTime() + (1 * 24 * 60 * 60 * 1000));
  const expires = "expires=" + date.toUTCString();
  document.cookie = cookieName + "=true; " + expires + "; path=/";
}

//Checks if cookie exists
function hasSubmittedReview(imdbID) {
  const cookieName = imdbID + "_reviewed";
  const cookies = document.cookie.split('; ');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].split('=');
    if (cookie[0] === cookieName) {
      return cookie[1] === "true";
    }
  }
  return false;
}