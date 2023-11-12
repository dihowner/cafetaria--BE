import bodyParser from "body-parser"
import cors from "cors"
import helmet from "helmet"
import httpStatusCode from "http-status-codes";

import AuthRoute from "../routes/auth.js";
import UserRoute from "../routes/user.js";

const routeApp = function (app) {
	app.use(bodyParser.json())
	app.use(cors())
	app.use(helmet())

    app.use("/api/auth/", AuthRoute);
    app.use("/api/user/", UserRoute);

	app.all("*", (request, response) => {
		return response.status(404).json({
			status: "error",
			code: httpStatusCode.BAD_REQUEST,
			message: `You missed the road. Can not ${request.method} ${request.originalUrl} on this server `,
		})
	})
}

export default routeApp
