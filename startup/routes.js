import bodyParser from "body-parser"
import cors from "cors"
import helmet from "helmet"
import httpStatusCode from "http-status-codes";

import CartRoute from "../routes/cart.js";
import OrderRoutes from "../routes/orders.js";
import AuthRoute from "../routes/auth.js";
import UserRoute from "../routes/user.js";
import WalletRoute from "../routes/wallet.js";
import MealRoute from "../routes/meal.js";
import MealCatogoryRoute from "../routes/mealcategory.js";
import SubMealRoute from "../routes/submeal.js";
import VendorRoute from "../routes/vendor.js";
import TrashRoute from "../routes/trash.js";
import BankRoute from "../routes/banks.js";
import WithdrawalRoute from "../routes/withdrawal.js";
import MartRoute from "../routes/marts.js";
import GroceryRoute from "../routes/grocery.js";
import GroceryCategoryRoute from "../routes/grocerycategory.js";
import RolesRoute from "../routes/roles.js";
import AdminRoute from "../routes/admin.js";
import BroadcastRoute from "../routes/broadcast.js";
import SettingsRoute from '../routes/settings.js'

const routeApp = function (app) {
	app.use(bodyParser.json())
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(cors())
	app.use(helmet())

    app.use("/api/cart/", CartRoute);
    app.use("/api/orders/", OrderRoutes);
    app.use("/api/auth/", AuthRoute);
    app.use("/api/user/", UserRoute);
    app.use("/api/wallet/", WalletRoute);
    app.use("/api/meals/", MealRoute);
    app.use("/api/meals/category/", MealCatogoryRoute);
    app.use("/api/submeal/", SubMealRoute);
    app.use("/api/vendor/", VendorRoute);
    app.use("/api/banks/", BankRoute);
    app.use("/api/withdrawal/", WithdrawalRoute);
    app.use("/api/marts/", MartRoute);
    app.use("/api/grocery/", GroceryRoute);
    app.use("/api/grocery/category/", GroceryCategoryRoute);
    app.use("/api/admin/", AdminRoute);
    app.use("/api/settings/", SettingsRoute);
    app.use("/api/broadcast/", BroadcastRoute);
    app.use("/api/roles/", RolesRoute);
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
