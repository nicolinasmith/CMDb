const config = {
        
    apis: {
        cmdbApi: "https://grupp6.dsvkurs.miun.se/api/",
        omdbApi: "https://www.omdbapi.com/?",
    },
    roles: {
        admin: "grupp11",
    }, 
    endpoints: { 
        cmdb: {
            getLatestReview: "movies/latest/",
            getToplist: "toplists/",
            putRate: "movies/rate/",
            getMovies: "movies/",
            getSingleRate: "movies/",
            postReview: "api/movies/review",
            getKeys: "keys/grupp11_omdb/36ef6ec9-c34d-4238-86e6-ba7d002017aa",
        },
    }
};

export default config;