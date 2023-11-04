import winston from "winston"

const logger = function () {
	winston.add(
		new winston.transports.File({
			filename: "./logs/errors.log",
			level: "error",
		})
	)
	winston.add(
		new winston.transports.Console({
			colorize: true,
			prettyPrint: true,
		})
	)
}

export default logger
