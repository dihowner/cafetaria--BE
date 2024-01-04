import bodyParser from "body-parser"
import cors from "cors"
import helmet from "helmet"
import httpStatusCode from "http-status-codes";

import AuthRoute from "../routes/auth.js";
import UserRoute from "../routes/user.js";
import WalletRoute from "../routes/wallet.js";
import MealRoute from "../routes/meal.js";
import SubMealRoute from "../routes/submeal.js";
import VendorRoute from "../routes/vendor.js";
import TrashRoute from "../routes/trash.js";
import BankRoute from "../routes/banks.js";
import WithdrawalRoute from "../routes/withdrawal.js";
import MartRoute from "../routes/marts.js";

const routeApp = function (app) {
	app.use(bodyParser.json())
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(cors())
	app.use(helmet())

    app.use("/api/auth/", AuthRoute);
    app.use("/api/user/", UserRoute);
    app.use("/api/wallet/", WalletRoute);
    app.use("/api/meals/", MealRoute);
    app.use("/api/submeal/", SubMealRoute);
    app.use("/api/vendor/", VendorRoute);
    app.use("/api/banks/", BankRoute);
    app.use("/api/withdrawal/", WithdrawalRoute);
    app.use("/api/marts/", MartRoute);
    app.use("/api/trash/", TrashRoute);

	app.all("*", (request, response) => {
		return response.status(httpStatusCode.NOT_FOUND).json({
			status: "error",
			code: httpStatusCode.BAD_REQUEST,
			message: `You missed the road. Can not ${request.method} ${request.originalUrl} on this server `,
		})
	})
}

export default routeApp
