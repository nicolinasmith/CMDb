import {fetchCmdbTopList, fetchMovieData, handleReadMoreClick, rateMovie, fetchLatestReview} from './api.js';

const topThreeElement = document.getElementById('top');
const moreFilmsElement = document.getElementById('more-films');
const pagingButton = document.getElementById('paging-button');
const textElement = document.getElementById('main-headline');
const badMoviesButton = document.getElementById('kalkon-button');
const latestReviewElement = document.getElementById('latest-review');
const latestReviewButton = document.getElementById('latest-review-button');
let isBadMoviesShown = false;
let readMoreIsClicked = false;

const fetchToplistParams = "toplists?sort=DESC&limit=11&page=1&countLimit=2";
const cmdbTopList = await fetchCmdbTopList(fetchToplistParams);
const omdbData = await fetchMovieData(cmdbTopList);
const fullMovieData = await createFullMovieData(cmdbTopList, omdbData);
await createMovieList(fullMovieData);

const latestReviews = [];
getLatestReview();

askForCookieConsent();

//Creates movie objects with data from cmdb and omdb
async function createFullMovieData(cmdbList, omdbData) {

  const fullMovieData = [];

  for (let i = 0; i < cmdbList.length; i++) {
    const omdbMovie = omdbData[i];
    const imdbID = omdbMovie.imdbID;
    const cmdbMovie = cmdbList.find(movie => movie.imdbID === imdbID);

    if (cmdbMovie) {
      const combinedMovieData = {
        title: omdbMovie.Title,
        poster: omdbMovie.Poster,
        plot: omdbMovie.Plot,
        imdbID: imdbID,
        imdbRating: omdbMovie.imdbRating,

        score: cmdbMovie.cmdbScore,
        topScore: cmdbMovie.topScore,
        minScore: cmdbMovie.minScore,
        count: cmdbMovie.count,
      };
      fullMovieData.push(combinedMovieData);
    }
  }
  return fullMovieData;
}

//Creates HTML-elements with style and event listener for each movie
function createMovieElement(movieData, index) {
  const movieContainer = document.createElement('div');
  const imgContainer = document.createElement('div'); 

  const posterLinkElement = document.createElement('a');
  const posterElement = document.createElement('img');

  const contentContainer = document.createElement('div');

  const titleContainer = document.createElement('div');
  const titleElement = document.createElement('h3');
  const titleLinkElement = document.createElement('a');

  const plotElement = document.createElement('p');
  const readElement = document.createElement('a');
  const scoreElement = document.createElement('p');
  const rateElement = document.createElement('p');
  const buttonContainer = document.createElement('div');

  titleElement.textContent = `${index + 1}. ${movieData.title}`;
  titleLinkElement.href = `film.html?imdbID=${movieData.imdbID}#headlines`;
  titleElement.style.cursor = 'pointer';
  posterElement.src = (movieData.poster === 'N/A') ? './img/no-poster.jpg' : movieData.poster;
  posterElement.alt = `Omslagsbild för: ${movieData.title}`; 
  posterLinkElement.href = `film.html?imdbID=${movieData.imdbID}#headlines`;
  
  plotElement.textContent = movieData.plot;
  readElement.textContent = 'Läs mer';
  readElement.href = '#';
  
  scoreElement.textContent = `CMDb Score: ${movieData.score}`;	
  rateElement.textContent = 'Betygsätt filmen:';
  buttonContainer.appendChild(rateElement);

  for (let i = 1; i <= 4; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.classList.add('btn' + i);
    btn.setAttribute('data-score', i);
    btn.setAttribute('data-imdbID', movieData.imdbID);
  
    if (hasSubmittedReview(movieData.imdbID)) {
      btn.disabled = true;
      btn.style.opacity = 0.2;
      btn.style.cursor = 'default';
      rateElement.textContent = 'Du har redan betygsatt filmen. Tack för ditt bidrag!';
    } else {
      btn.addEventListener('click', async function(event) {
        const score = event.target.getAttribute('data-score');
        const imdbID = event.target.getAttribute('data-imdbID');

        const isConfirmed = confirm(`Vill du betygsätta '${movieData.title}' med '${score}'?`);

        if (isConfirmed) {
          const updatedScore = await rateMovie(score, imdbID);
          rateElement.textContent = `Tack för ditt betyg! Du gav filmen: ${score}.`;
          scoreElement.textContent = `CMDb Score: ${updatedScore}`;
          inActivateRatingButtons(imdbID);
        }
      });
    }
    buttonContainer.appendChild(btn);
  }

  movieContainer.appendChild(imgContainer);
  titleContainer.appendChild(titleElement);
  titleContainer.appendChild(titleLinkElement);
  contentContainer.appendChild(titleContainer);
  posterLinkElement.appendChild(posterElement); 
  imgContainer.appendChild(posterLinkElement);
  contentContainer.appendChild(plotElement);
  contentContainer.appendChild(readElement);
  contentContainer.appendChild(scoreElement);
  movieContainer.appendChild(contentContainer);
  movieContainer.appendChild(buttonContainer);
  plotElement.classList.add('plot-alignment');
  titleContainer.classList.add('hover-text');
  buttonContainer.classList.add('grades');
  movieContainer.classList.add('section', 'width-content');
  readElement.classList.add('read-more');
  
  readElement.addEventListener('click', async function(event) {
    event.preventDefault();
    if (readMoreIsClicked) {
      readElement.textContent = 'Läs mer';
      readMoreIsClicked = false;
      plotElement.textContent = movieData.plot;
    } else {
      readElement.textContent = 'Läs mindre';
      readMoreIsClicked = true;
      const fullPlot = await handleReadMoreClick(movieData.imdbID);
      plotElement.textContent = fullPlot;
    }
  });

  titleElement.addEventListener('click', function() {
    window.location.href = `film.html?imdbID=${movieData.imdbID}#headlines`;
  });
  
  return movieContainer;
}

//Creates lists the top three movies and the rest of the movies and calls to createMovieElement
async function createMovieList(fullMovieData) {

  for (let i = 0; i < Math.min(3, fullMovieData.length); i++) {
    const movieData = fullMovieData[i];
    const movieElement = createMovieElement(movieData, i);
    topThreeElement.appendChild(movieElement);
  }

  for (let i = 3; i < fullMovieData.length; i++) {
    const movieData = fullMovieData[i];
    const movieElement = createMovieElement(movieData, i);
    moreFilmsElement.appendChild(movieElement);
  }
}

//Inactivate the score buttons after rating
function inActivateRatingButtons(imdbID) {

  setReviewedCookie(imdbID)

  const ratingButtons = document.querySelectorAll(`.grades button[data-imdbID="${imdbID}"]`);
  ratingButtons.forEach((btn) => {
      btn.disabled = true;
      btn.style.opacity = 0.2;
      btn.style.cursor = 'default';
  });
}

//Asks for cookie consent
function askForCookieConsent() {
  const consent = localStorage.getItem('cookieConsent');
  if (!consent) {
      const consentMessage = "Vi använder cookies för att förbättra din upplevelse på vår webbplats. Genom att använda vår webbplats godkänner du användningen av cookies. Läs vår integritetspolicy för mer information.";
      if (confirm(consentMessage)) {
          localStorage.setItem('cookieConsent', 'true');
      }
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

//Button to see the bad movies "kalkonlistan"
badMoviesButton.addEventListener('click', async function() {
  
  if (isBadMoviesShown) {
    textElement.textContent = 'Topplistan';
    badMoviesButton.textContent = 'Visa kalkonlistan';
    topThreeElement.innerHTML = '';
    moreFilmsElement.innerHTML = '';

    pagingButton.style.display = 'block';
    
    const fullMovieData = await createFullMovieData(cmdbTopList, omdbData);
    await createMovieList(fullMovieData);
  } else {
    textElement.textContent = 'Kalkonlistan';
    badMoviesButton.textContent = 'Visa topplistan';
    
    const fetchBadListParams = "toplists?sort=asc&limit=11&page=1&countLimit=2";
    const cmdbBadList = await fetchCmdbTopList(fetchBadListParams);
    const omdbBadData = await fetchMovieData(cmdbBadList);
    const fullBadMovieData = await createFullMovieData(cmdbBadList, omdbBadData);

    pagingButton.style.display = 'none';
    
    topThreeElement.innerHTML = '';
    moreFilmsElement.innerHTML = '';
    await createMovieList(fullBadMovieData);
  }
  isBadMoviesShown = !isBadMoviesShown;

  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
});

//Fetches the latest review, calls displayLatestReview every 3 seconds to update the review
async function getLatestReview() {
  
  try {
    const latestReview = await fetchLatestReview();
    displayLatestReview(latestReview);
    setTimeout(getLatestReview, 3000);
  } catch (error) {
    console.error('Fel vid hämtning av senaste recensionen: ', error);
    latestReviewElement.textContent = 'Ingen recension att visa.';
    setTimeout(getLatestReview, 3000);
  }
}

//Displays the latest review
function displayLatestReview(latestReview) {

  if (latestReviews.length > 0) {
    latestReviewElement.removeChild(latestReviews[0]);
    latestReviews.shift();
  }
  
    const reviewContainer = document.createElement('div');
    const titleElement = document.createElement('h4');
    const authorElement = document.createElement('p');
    const dateElement = document.createElement('i');
    const ratingElement = document.createElement('p');
    const reviewElement = document.createElement('p');

    titleElement.textContent = latestReview.title;
    authorElement.textContent = `Cineast: ${latestReview.review.reviewer}`;
    dateElement.textContent = `Datum: ${latestReview.review.date}`;
    ratingElement.textContent = `CMDb Score: ${latestReview.review.score}`;
    reviewElement.textContent = `Recension: ${latestReview.review.review}`;

    reviewContainer.appendChild(titleElement);
    reviewContainer.appendChild(dateElement);
    reviewContainer.appendChild(authorElement);
    reviewContainer.appendChild(reviewElement);
    reviewContainer.appendChild(ratingElement);
    latestReviewElement.appendChild(reviewContainer);
    latestReviewElement.classList.add('latest-review-design');

    latestReviews.push(reviewContainer);

    latestReviewButton.addEventListener('click', function() {
      const imdbID = latestReview.review.imdbID;
      window.location.href = `film.html?imdbID=${imdbID}`;
    });
}

//When clicking on paging button at most 3 times, more movies are displayed
let currentMovieIndex = fullMovieData.length;
let addedMovies = [];
pagingButton.addEventListener('click', async function() {
  
  let params = "";

  switch (currentMovieIndex) {
    case currentMovieIndex < 11:
      const notification = document.createElement('p');
      notification.textContent = 'Inga fler filmer att hämta.';
      moreFilmsElement.appendChild(notification);
    case 11:
      params = "toplists?sort=desc&limit=11&page=2&countLimit=2";
      fetchAndDisplayPaging(params, currentMovieIndex);
      currentMovieIndex += 11;
      break;
    case 22:
      params = "toplists?sort=desc&limit=11&page=3&countLimit=2";
      fetchAndDisplayPaging(params, currentMovieIndex);
      currentMovieIndex += 11;
      break;
    case 33:
      params = "toplists?sort=desc&limit=11&page=4&countLimit=2";
      fetchAndDisplayPaging(params, currentMovieIndex);
      pagingButton.textContent = 'Visa färre filmer';
      currentMovieIndex += 11;
      break;
    case 44:
      pagingButton.textContent = 'Visa fler filmer';
      removePagedMovies();
      currentMovieIndex = fullMovieData.length;
      break;
    }
});

//Fetches and displays movies from paging
async function fetchAndDisplayPaging(params, currentMovieIndex) {

  const cmdbPagingTopList = await fetchCmdbTopList(params);
  const omdbDataPaging = await fetchMovieData(cmdbPagingTopList);
  const fullMovieData = await createFullMovieData(cmdbPagingTopList, omdbDataPaging);
  
  for (let i = 0; i < fullMovieData.length; i++) {
    const movieData = fullMovieData[i];
    const movieElement = createMovieElement(movieData, currentMovieIndex);
    moreFilmsElement.appendChild(movieElement);
    addedMovies.push(movieElement);
    currentMovieIndex++;
  }
}

//Remove moves that has been added by paging
function removePagedMovies() {
  const moreFilmsContainer = document.getElementById('more-films');
  for (const movieElement of addedMovies) {
    moreFilmsContainer.removeChild(movieElement);
  }
  
  addedMovies.splice(0, addedMovies.length);
}