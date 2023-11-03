import {searchMovieOmdb, allMoviesCmdb, rateMovie, fetchMovieData} from './api.js';

const searchInput = document.getElementById('search-box');
const searchButton = document.getElementById('search-button');
const searchCommentElement = document.getElementById('search-result');
const searchElement = document.getElementById('search-hits');
const searchHeadline = document.getElementById('search-headline');
const searchBar = document.getElementById('search-bar');
const searchSuggestions = document.getElementById('search-suggestions');
searchHeadline.style.display = 'none';
searchBar.style.display = 'none';
let searchSuggestionsVisible = false;
let newSearchIsMade = false;

//Enable search suggestions
searchInput.addEventListener("input", function() { 
  searchSuggestions.style.display = 'block';
  newSearchIsMade = false;
});

//Search with query string from other page with search bar
const searchParams = new URLSearchParams(window.location.search);
const searchString = searchParams.get("search");
if (searchString) {
  searchInput.value = searchString;
  executeSearch(searchString);
}

//Search from input with button
searchButton.addEventListener("click", function() {
  const inputValue = searchInput.value.trim();
  searchParams.set("search", inputValue);
  history.pushState({}, '', `${window.location.pathname}?${searchParams.toString()}`);
  executeSearch(inputValue);
});

//Search from input with enter key
searchInput.addEventListener("keyup", function(event) {
  if (event.key === "Enter") {
    const inputValue= searchInput.value.trim();
    searchParams.set("search", inputValue);
    history.pushState({}, '', `${window.location.pathname}?${searchParams.toString()}`);
    executeSearch(inputValue);
  }
});

//Execute the search by chosen event listener
async function executeSearch(searchString) {
  searchSuggestions.style.display = 'none';
  newSearchIsMade = true;

  searchElement.innerHTML = '';
  const searchedMoviesOmdb = await searchMovieOmdb(searchString);
  if (searchedMoviesOmdb === undefined || searchedMoviesOmdb === null || searchedMoviesOmdb.length === 0) {
    console.error('Fel inträffade vid sökning.');
    searchCommentElement.textContent = `Fel inträffade vid sökning på "${searchString}". Prova att specificera din sökning och kontrollera stavningen.`;
    return;
  }
  else {
    const omdbMoviesFullData = await fetchMovieData(searchedMoviesOmdb);
    const allMoviesInCmdb = await allMoviesCmdb();
    const searchedMovies = await combineMovieData(omdbMoviesFullData, allMoviesInCmdb);
    const filteredMovies = filterMoviesByCriteria(searchedMovies);
   
    displaySearchHits(filteredMovies);

    const totalHits = filteredMovies.cmdbMovies.length + filteredMovies.onlyOmdbMovies.length;
    searchHeadline.style.display = 'block';
    searchCommentElement.innerHTML = '';
    searchCommentElement.textContent = `${totalHits} träffar på din sökning för "${searchString}":`;
  }
}

//Compare the movies from omdb and cmdb to display the correct information during search
async function combineMovieData(omdbMoviesFullData, allMoviesInCmdb) {

  const cmdbMovies = [];
  const onlyOmdbMovies = [];

  for (let i = 0; i < omdbMoviesFullData.length; i++) {
    const movieOmdb = omdbMoviesFullData[i];
    const imdbID = movieOmdb.imdbID;
    const movieCmdb = allMoviesInCmdb.find(movie => movie.imdbID === imdbID);

    if (movieCmdb) {
        const combinedMovieData = {
        Title: movieOmdb.Title,
        Poster: movieOmdb.Poster,
        Year: movieOmdb.Year,
        imdbID: imdbID,
        Score: movieCmdb.cmdbScore,
        Runtime: movieOmdb.Runtime,
        Genre: movieOmdb.Genre,
      };
      cmdbMovies.push(combinedMovieData);
    } else {
      onlyOmdbMovies.push(movieOmdb);
    }
  }
  return {
    cmdbMovies: cmdbMovies,
    onlyOmdbMovies: onlyOmdbMovies,
  };
}

//Display and create each searched movies
function displaySearchHits(filteredMovies) {

  const searchElement = document.getElementById('search-hits');
  const allMovies = filteredMovies.cmdbMovies.concat(filteredMovies.onlyOmdbMovies);

  for (let i = 0; i < allMovies.length; i++) {
    const movie = allMovies[i];
    
    const movieContainer = document.createElement('div');
    const imgContainer = document.createElement('div');
    const posterLinkElement = document.createElement('a');
    const posterElement = document.createElement('img');
    const contentContainer = document.createElement('div');
    const titleContainer = document.createElement('div');
    const titleLinkElement = document.createElement('a');
    const titleElement = document.createElement('h3');
    const yearElement = document.createElement('p');
    const genreElement = document.createElement('p');
    const runtimeElement = document.createElement('p');
    const rateElement = document.createElement('p');
    const scoreElement = document.createElement('p');
    const buttonContainer = document.createElement('div');
    
    titleElement.textContent = movie.Title;
    titleLinkElement.href = `film.html?imdbID=${movie.imdbID}#headlines`;
    posterElement.src = (movie.Poster === 'N/A') ? './img/no-poster.jpg' : movie.Poster;
    posterLinkElement.href = `film.html?imdbID=${movie.imdbID}#headlines`;
    posterElement.alt = `Omslagsbild för: ${movie.Title}`; 
    titleContainer.style.cursor = 'pointer';
    yearElement.textContent = `Årtal: ${movie.Year}`;
    genreElement.textContent = `Genre: ${movie.Genre}`;
    runtimeElement.textContent = `Speltid: ${movie.Runtime}`;
    scoreElement.textContent = allMovies[i].Score
    ? `CMDb Score: ${movie.Score}`
    : 'Bli först med att betygsätta filmen och lägga till den på CMDb:';
    rateElement.textContent = 'Betygsätt filmen:';
    movieContainer.appendChild(imgContainer);
    imgContainer.appendChild(posterLinkElement);
    posterLinkElement.appendChild(posterElement);
    buttonContainer.appendChild(rateElement);
    
    for (let i = 1; i <= 4; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.classList.add('btn' + i);
      btn.setAttribute('data-score', i);
      btn.setAttribute('data-imdbID', movie.imdbID);
    
      if (hasSubmittedReview(movie.imdbID)) {
        btn.disabled = true;
        btn.style.opacity = 0.2;
        btn.style.cursor = 'default';
        rateElement.textContent = 'Du har redan betygsatt filmen. Tack för ditt bidrag!';
      } else {
        btn.addEventListener('click', async function(event) {
          const score = event.target.getAttribute('data-score');
          const imdbID = event.target.getAttribute('data-imdbID');
          const isConfirmed = confirm(`Vill du betygsätta '${movie.Title}' med '${score}'?`);

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
    
    titleContainer.appendChild(titleElement);
    titleContainer.appendChild(titleLinkElement);
    contentContainer.appendChild(titleContainer);
    contentContainer.appendChild(yearElement);
    contentContainer.appendChild(genreElement);
    contentContainer.appendChild(runtimeElement);
    contentContainer.appendChild(scoreElement);
    movieContainer.appendChild(contentContainer);
    contentContainer.appendChild(buttonContainer);

    movieContainer.classList.add('search-layout');
    titleContainer.classList.add('hover-text')
    buttonContainer.classList.add('grades');
    
    searchElement.appendChild(movieContainer);

    titleElement.addEventListener('click', function() {
      window.location.href = `film.html?imdbID=${movie.imdbID}#headlines`;
    });
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

//Filters the movies by checkbox status
function filterMoviesByCriteria(searchedMovies) {

  const filteredMovies = {
    cmdbMovies: [],
    onlyOmdbMovies: [],
  };

  const addedMovies = new Set();

  searchedMovies.cmdbMovies.forEach((movie) => {
    if (shouldIncludeMovie(movie) && !addedMovies.has(movie.imdbID)) {
      filteredMovies.cmdbMovies.push(movie);
      addedMovies.add(movie.imdbID);
    }
  });

  searchedMovies.onlyOmdbMovies.forEach((movie) => {
    if (shouldIncludeMovie(movie) && !addedMovies.has(movie.imdbID)) {
      filteredMovies.onlyOmdbMovies.push(movie);
      addedMovies.add(movie.imdbID);
    }
  });

  return filteredMovies;
}

//List of filter criteria for the checkboxes
const filterCriteria = [
  {
    id: 'checkboxLow',
    type: 'rating',
    field: 'Score',
    min: 0,
    max: 1,
  },
  {
    id: 'checkboxMediumLow',
    type: 'rating',
    field: 'Score',
    min: 1,
    max: 2,
  },
  {
    id: 'checkboxMediumHigh',
    type: 'rating',
    field: 'Score',
    min: 2,
    max: 3,
  },
  {
    id: 'checkboxHigh',
    type: 'rating',
    field: 'Score',
    min: 3,
    max: 4,
  },
  {
    id: 'checkbox70',
    type: 'year',
    minYear: 1900,
    maxYear: 1979,
  },
  {
    id: 'checkbox80',
    type: 'year',
    minYear: 1980,
    maxYear: 1989,
  },
  {
    id: 'checkbox90',
    type: 'year',
    minYear: 1990,
    maxYear: 1999,
  },
  {
    id: 'checkbox00',
    type: 'year',
    minYear: 2000,
    maxYear: 2009,
  },
  {
    id: 'checkbox10',
    type: 'year',
    minYear: 2010,
    maxYear: 2024,
  },
  {
    id: 'checkboxShort',
    type: 'range',
    field: 'Runtime',
    min: 0,
    max: 59,
  },
  {
    id: 'checkboxMedium',
    type: 'range',
    field: 'Runtime',
    min: 60,
    max: 119,
  },
  {
    id: 'checkboxLong',
    type: 'range',
    field: 'Runtime',
    min: 120,
    max: 1000,
  },
  {
    id: 'checkboxAction',
    type: 'genre',
    genre: 'Action',
  },
  {
    id: 'checkboxComedy',
    type: 'genre',
    genre: 'Comedy',
  },
  {
    id: 'checkboxHorror',
    type: 'genre',
    genre: 'Horror',
  },
  {
    id: 'checkboxFantasy',
    type: 'genre',
    genre: 'Fantasy',
  },
  {
    id: 'checkboxAdventure',
    type: 'genre',
    genre: 'Adventure',
  },
];

//Checks if the movie should be included in the search result by the checkbox status
function shouldIncludeMovie(movie) {

  const runtime = parseInt(movie.Runtime, 10);
  const genreString = movie.Genre;
  const genres = genreString.replace(/\s/g, '').split(',');
  const year = parseInt(movie.Year, 10);
  const score = movie.Score;

  let meetsAllCriteria = true;

  for (const criteria of filterCriteria) { 
    if (criteria.id && checkboxStatus[criteria.id]) {
      switch (criteria.type) {
        case 'rating':
          if (!(score >= criteria.min && score <= criteria.max)) {
            meetsAllCriteria = false;
          }
          break;
        case 'range':
          if (!(runtime >= criteria.min && runtime <= criteria.max)) {
            meetsAllCriteria = false;
          }
          break;
        case 'year':
          if (!((criteria.minYear ? year >= criteria.minYear : true) &&
            (criteria.maxYear ? year <= criteria.maxYear : true))) 
          {
            meetsAllCriteria = false;
          }
          break;
        case 'genre':
          if (!genres.includes(criteria.genre)) {
            meetsAllCriteria = false;
          }
          break;
        default:
      }
    }
  }
  return meetsAllCriteria;
}

//To handle the checkboxes
const checkboxStatus = {};
const checkboxes = document.querySelectorAll('input[type="checkbox"]');
checkboxes.forEach(checkbox => {
  const checkboxId = checkbox.id;
  checkboxStatus[checkboxId] = false;
});

checkboxes.forEach(checkbox => {
  checkbox.addEventListener('change', function(event) {
    const checkboxId = event.target.id;
    checkboxStatus[checkboxId] = !checkboxStatus[checkboxId];

    const inputValue = searchInput.value;
    //Make sure that a first search is made, so that choosing a checkbox doesn't trigger a new search
    if (newSearchIsMade) {
    executeSearch(inputValue); }
  });
}); 

//Search suggestions when input search bar
searchInput.addEventListener('input', async function() {
  searchSuggestionsVisible = true;
    const searchText = searchInput.value.trim();

    if (searchText === '') {
        searchSuggestions.innerHTML = '';
        searchSuggestions.style.display = 'none';
        return;
    }
    else {
    const movies = await searchMovieOmdb(searchText);
    searchSuggestions.innerHTML = '';

    const searchSuggestionElements = document.createElement('div');
    
    const listHeadline = document.createElement('i');
    listHeadline.textContent = `Förslag på sökningar som innehåller "${searchText}":`;
    searchSuggestions.classList.add('suggestion-box');

    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.classList.add('search-suggestion-close');

    searchSuggestionElements.appendChild(listHeadline);
    searchSuggestionElements.appendChild(closeButton);
    searchSuggestionElements.classList.add('search-suggestion-elements');
    
    searchSuggestions.appendChild(searchSuggestionElements);

    displaySearchSuggestions(movies)
    
    const showAllSearch = document.createElement('button');
    showAllSearch.textContent = 'Visa alla sökresultat';
    showAllSearch.classList.add('show-all-button');
    searchSuggestions.appendChild(showAllSearch);
    
    showAllSearch.addEventListener('click', function() { 
      executeSearch(searchText);
    });
    
    closeButton.addEventListener('click', function() {
        searchSuggestions.innerHTML = '';
        searchSuggestions.style.display = 'none';

     });
  }
});

//Display the search suggestions below the search bar
function displaySearchSuggestions (movies) {
  
  for (let i = 0; i < 3; i++) {
    const movie = movies[i];
    
    const listItem = document.createElement('div');
    const linkElement = document.createElement('a');
    linkElement.href = `film.html?imdbID=${movie.imdbID}`;
    listItem.appendChild(linkElement);
    
    const titleElement = document.createElement('p');
    const posterElement = document.createElement('img');
    titleElement.textContent = movie.Title;
    posterElement.src = movie.Poster === 'N/A' ? './img/no-poster.jpg' : movie.Poster;
    
    listItem.appendChild(posterElement);
    listItem.appendChild(titleElement);
    
    listItem.addEventListener('click', function() {
      window.location.href = `film.html?imdbID=${movie.imdbID}`;
    });
    
    searchSuggestions.appendChild(listItem);
    listItem.classList.add('search-suggestions');
  }
}

//Make sure the search suggestions disappear when clicking outside the search suggestions box
document.addEventListener('click', function(event) {
  if (!event.target.closest('#search-suggestions') && !searchSuggestionsVisible) {
    searchSuggestions.innerHTML = '';
    searchSuggestions.style.display = 'none';
  }
  searchSuggestionsVisible = false;
});

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

//Sets cookie with 1 day expiry
function setReviewedCookie(imdbID) {
  const cookieName = imdbID + "_reviewed";
  const date = new Date();
  date.setTime(date.getTime() + (1 * 24 * 60 * 60 * 1000));
  const expires = "expires=" + date.toUTCString();
  document.cookie = cookieName + "=true; " + expires + "; path=/";
}