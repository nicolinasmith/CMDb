import { allMoviesCmdb, fetchMovieData } from './api.js';

const cmdbMovies = await allMoviesCmdb();
const omdbData = await fetchMovieData(cmdbMovies);
const combinedMovieData = combineMovieData(cmdbMovies, omdbData);


//Scroll to top button
const scrollToTopButton = document.getElementById('scrollToTopButton');
scrollToTopButton.addEventListener('click', function() {
  scrollToTop(0, 500);
});

function scrollToTop(to, duration) {
  if (duration <= 0) return;
  const difference = to - window.scrollY;
  const perTick = (difference / duration) * 10;

  setTimeout(function() {
      window.scrollBy(0, perTick);
      if (window.scrollY === to) return;
      scrollToTop(to, duration - 10);
  }, 10);
}

//Collects data from cmdb and omdb and combines them to make an autocomplete search
function combineMovieData(cmdbMovies, omdbData) {

  const combinedMovieData = [];

  omdbData.forEach((movieOmdb) => {
    const imdbID = movieOmdb.imdbID;
    const movieCmdb = cmdbMovies.find((movie) => movie.imdbID === imdbID);

    if (movieCmdb) {
      const movie = {
        title: movieOmdb.Title,
        imdbID: imdbID,
      };
      combinedMovieData.push(movie);
    }
  });
  return combinedMovieData;
}

//Search bar, when enter the search start ands goes to search.html
const searchBarInput = document.getElementById("search-bar-input");
let searchSuggestionsVisible = false;

const searchBarSuggestions = document.getElementById("search-bar-suggestions");
searchBarInput.addEventListener("keyup", function(event) {
  if (event.key === "Enter") {
    const searchString = searchBarInput.value;
    window.location.href = `search.html?search=${searchString}#headlines`;
  }
});

//Show search suggestions
searchBarInput.addEventListener('input', async function() {
  
  searchSuggestionsVisible = true; 

  if (searchBarInput.value === '') {
    searchBarSuggestions.innerHTML = '';
    searchBarSuggestions.style.display = 'none';
    return;
    
  } else {
    const moviesByFirstChar = findMovieByChars(combinedMovieData, searchBarInput.value);
    
    searchBarSuggestions.innerHTML = '';
    searchBarSuggestions.style.display = 'block';
    searchBarSuggestions.classList.add('search-bar-suggestions');
    
    const textElement = document.createElement('i');
    textElement.textContent = 'Söker du efter...';
    searchBarSuggestions.appendChild(textElement);
    
    for (let i = 0; i < 4; i++) {
      const movie = moviesByFirstChar[i];
      
      const listItem = document.createElement('div');
      const linkElement = document.createElement('a');
      const titleElement = document.createElement('p');
      const titleText = movie.title;
      const boldTitleText = titleText.replace(
        new RegExp(searchBarInput.value, 'gi'), 
        match => `<span class="bold-text">${match}</span>`
        );
        titleElement.innerHTML = boldTitleText;
        linkElement.href = `film.html?imdbID=${movie.imdbID}`;
        listItem.appendChild(linkElement);
        listItem.appendChild(titleElement);
        listItem.classList.add('suggestion-item');
        
        listItem.addEventListener('click', function() {
          window.location.href = `film.html?imdbID=${movie.imdbID}`;
        });
        
        searchBarSuggestions.appendChild(listItem);
      }
    }
});
  
//Find movies by first character in title
function findMovieByChars(movies, value){
    
  const sortedMovies = [];
  const searchTerm = value.toLowerCase();
    
  movies.forEach(movie => {
      const title = movie.title.toLowerCase();
      if (title.startsWith(searchTerm)) {
        sortedMovies.push(movie);
    }
  });
  
  return sortedMovies;
}

//Make sure the search suggestions disappear when clicking outside the search suggestions box
document.addEventListener('click', function(event) {
  if (!event.target.closest('#search-bar-suggestions') && !searchSuggestionsVisible) {
    searchBarSuggestions.innerHTML = '';
    searchBarSuggestions.style.display = 'none';
  } else {
    searchSuggestionsVisible = false;
  }
});