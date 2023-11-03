import config from './app.js';
//const password = '36ef6ec9-c34d-4238-86e6-ba7d002017aa';

const cmdbBaseUrl = config.apis.cmdbApi;
const omdbBaseUrl = config.apis.omdbApi;
const endpoints = config.endpoints.cmdb;

//Gets api key from cmdb to get access to omdb
async function getApiKey() {

  try {
    const url = cmdbBaseUrl + endpoints.getKeys;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data ${response.status}`);
    }
    const data = await response.json();
    return data.apiKey;
  } 
  catch (error) {
    console.error("Error fetching data:", error.message);
  }
}

//Gets data from omdb for each movie in list
async function fetchMovieData(movieList) {
  
  const key = await getApiKey();
  const omdbData = [];
  
  for (const movie of movieList) {
    try {
      const url = omdbBaseUrl + new URLSearchParams({ i: movie.imdbID, apikey: key });
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch data for imdbID ${movie.imdbID}. Status: ${response.status}`);
      }
      const data = await response.json();
      omdbData.push(data);

    } catch (error) {
      console.error('Error:', error);
    }
  }
  return omdbData;
}

//Gets data for single movie from Omdb
async function fetchSingleMovieData(imdbID) {

  const key = await getApiKey();
  let movie = {};

  try {
    const url = omdbBaseUrl + new URLSearchParams({ i: imdbID, apikey: key });
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch data for imdbID ${imdbID}. Status: ${response.status}`);
    }

    const omdbData = await response.json();

    if (omdbData) {
      movie = {
        poster: omdbData.Poster,
        title: omdbData.Title,
        release: omdbData.Released,
        genre: omdbData.Genre,
        runtime: omdbData.Runtime,
        plot: omdbData.Plot,
        imdbRating: omdbData.imdbRating,
        director: omdbData.Director,
        actors: omdbData.Actors,
      };
    }

  } catch (error) {
    console.error('Error:', error);
  }

  return movie;
}

//Gets single movie rating from Cmdb
async function fetchMovieRating(imdbID) {

  let movieRating = {};

  try {
    const url = cmdbBaseUrl + endpoints.getSingleRate + imdbID;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch rating for imdbID ${imdbID}. Status: ${response.status}`);
    }

    const cmdbData = await response.json();
    if (cmdbData) {
      movieRating = {
        cmdbScore: cmdbData.cmdbScore,
        ratingCount: cmdbData.count,
        categorizedScores: []
      };
      if (cmdbData.categorizedScores && Array.isArray(cmdbData.categorizedScores)) {
        for (const score of cmdbData.categorizedScores) {
          movieRating.categorizedScores.push({
            score: score.score,
            count: score.count
          });
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
  return movieRating;
}

//Gets list from CMDb
async function fetchCmdbTopList(params) 
{
  try {
    const url = cmdbBaseUrl + params;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch data. Status: ${response.status}`);
    }
    const cmdbList = await response.json();
    return cmdbList.movies;
  } 
  catch (error) {
    console.error('Error:', error);
  }
}

//Gets full plot from omdb when clicking on "Läs mer"
async function handleReadMoreClick(imdbID) {

  const key = await getApiKey();

  try {
    const url = omdbBaseUrl + new URLSearchParams({ i: imdbID, apikey: key, plot: 'full' });
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch data. Status: ${response.status}`);
    }
    const data = await response.json();
    return data.Plot;

  } catch (error) {
    console.error('Error:', error);
  }
}

//Searches for movie title in omdb, sends each result to fetchSingleMovieData
async function searchMovieOmdb(searchedTitle) {

  const key = await getApiKey();

  try {
    const url = omdbBaseUrl + new URLSearchParams({ apikey: key, s: searchedTitle, type: 'movie'});
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch data. Status: ${response.status}`);
      return response.status;
    }
    const data = await response.json();
    return data.Search;

  } catch (error) {
    console.error('Error:', error);
    return error;
  }
}

//Gets all movies in cmdb to complete the search compared to omdb
async function allMoviesCmdb() {

  try {
    const url = cmdbBaseUrl + endpoints.getMovies;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch data. Status: ${response.status}`);
    }
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error:', error);
  }
}

//Rate movies from search or start page
async function rateMovie(score, imdbID) {
 
  try {
    const url = cmdbBaseUrl + endpoints.putRate + `${imdbID}/${score}`;
    const response = await fetch(url, {
      method: "PUT",
    });

    if (response.ok) {
      console.log(`Filmen med IMDb ID: ${imdbID} gavs betyg: ${score}`);
    } else {
      console.error("Något blev fel. Filmen har inte betygsatts.");
      throw new Error("API request failed");
    }
    const updatedRating = await updateMovieRating(imdbID);
    return updatedRating;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

//Updates UI after rating movie
async function updateMovieRating(imdbID) {

  try {
    const url = cmdbBaseUrl + endpoints.getSingleRate + imdbID;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch data. Status: ${response.status}`);
    }
    const data = await response.json();
    return data.cmdbScore;

  } catch (error) {
    console.error('Error:', error);
  }
}

//Gets latest review from CMDb
async function fetchLatestReview() 
{
  try {
    const url = cmdbBaseUrl + endpoints.getLatestReview;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch data. Status: ${response.status}`);
    }
    const review = await response.json();
    const movieData = await fetchSingleMovieData(review.imdbID);
    return {
      review: review,
      title: movieData.title,
    };

  } catch (error) {
    console.error('Error:', error);
  }
}

//Posts review to omdb
async function postReviewToAPI(reviewDto) {
  try {
    const response = await fetch(`https://grupp6.dsvkurs.miun.se/api/movies/review`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewDto),
    });

    if (response.ok) {
      console.log(`Recensionen har sparats.`);
      return true; 
    } else {
      console.error("Något blev fel. Recensionen kunde inte sparas.");
      alert('Recensionen kunde inte sparas. Försök igen senare.');
      return false; 
    }
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
}

//Gets reviews from API
async function getReviews(imdbID) {
  let url = cmdbBaseUrl + endpoints.getMovies + imdbID;

  let reviewDtos = [];

  try {
    const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch data for imdbID ${imdbID}. Status: ${response.status}`);
  }

  let movie = await response.json();
  if (movie) {
    movie.reviews.forEach((review) => {
      console.log(review)
      if(review.reviewer !== null && review.review !== null) {
        let reviewDto = {
          imdbID: review.imdbID,
          author: review.reviewer,
          score: review.score,
          review: review.review,
          date: review.date
        };
        reviewDtos.push(reviewDto);
      }
    });
  }
  } catch (error) {
  console.error('Error:', error);
  }
  return reviewDtos;
}

export {searchMovieOmdb};
export {allMoviesCmdb};
export {fetchCmdbTopList};
export {fetchMovieData};
export {handleReadMoreClick};
export {fetchLatestReview};
export {fetchSingleMovieData};
export {fetchMovieRating}
export {rateMovie};
export {getReviews};
export {postReviewToAPI};