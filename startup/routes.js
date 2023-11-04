import bodyParser from "body-parser"
import cors from "cors"
import helmet from "helmet"

import AuthRoute from "../routes/auth.js";

const routeApp = function (app) {
	app.use(bodyParser.json())
	app.use(cors())
	app.use(helmet())

    app.use("/api/auth/", AuthRoute);
    app.use("/api/auth/", AuthRoute);

	app.all("*", (request, response) => {
		return response.status(404).json({
			status: "error",
			code: 404,
			message: `You missed the road. Can not ${request.method} ${request.originalUrl} on this server `,
		})
	})
}

export default routeApp
