import axios from "axios";

class httpRequest {

    async post(endpoint, body, headerParams = {}) {
        try {
            const response = await axios.post( endpoint, body, { headers : headerParams  })
            console.log(response.data); // Log the data if needed
            return response.data; // Return the data to the calling code
        }
        catch(error) {
            throw error;
        }
    }

    async get(endpoint, body = NULL, headerParams = {}) {
        try {
            const response = await axios.get( endpoint, { headers : headerParams  })
            console.log(response.data); // Log the data if needed
            return response.data; // Return the data to the calling code
        }
        catch(error) {
            throw error;
        }
    }
}

export default new httpRequest;