import _ from 'lodash';
import { isValidObjectId } from 'mongoose';
import { BadRequestError } from '../helpers/errorHandler.js';
import filesystem from "fs"

export default class ValidatorMiddleware {
	static validateRequest = (validator) => {
		return async (req, res, next) => {
            try {
                const { error, value } = await validator(req);
                if (error) {
                    const errorMessage = error.details[0].message;
                    throw new BadRequestError(errorMessage);
                }
                req.body = value;
                next();
            } catch (error) {
				// If file was uploaded and we have a JOI Validation error, we need to remove ASAP
				if (error && req.file) {
					filesystem.unlinkSync(req.file.path);
				}
                return res.status(error.status).json({message: error.message}); // Handle the rejected promise here
            }
		};
	};
	
	// This middleware is for validating request that has some special condition or uses one method to handle multiple requests
	static validateRequestActivity = (activityType, validator) => {
		return async (req, res, next) => {
            try {
				req.body.activity = activityType;
                const { error, value } = await validator(req);
                if (error) {
                    const errorMessage = error.details[0].message;
                    throw new BadRequestError(errorMessage);
                }
                req.body = value;
                next();
            } catch (error) {
				// If file was uploaded and we have a JOI Validation error, we need to remove ASAP
				if (error && req.file) {
					filesystem.unlinkSync(req.file.path);
				}
                return res.status(error.status).json({message: error.message}); // Handle the rejected promise here
            }
		};
	};

	static validateObjectIds = (idNames) => {
		return (req, res, next) => {
			try {
				idNames = Array.isArray(idNames) ? idNames : [idNames];
				const invalidId = _.find(idNames, (idName) => !isValidObjectId(req.params[idName]));
				next();
			} catch (error) {
				next(error);
			}
		};
	};

	static validateQueryObjectIds = (idNames) => {
		return (req, res, next) => {
			try {
				idNames = Array.isArray(idNames) ? idNames : [idNames];
				const invalidId = _.find(idNames, (idName) => !isValidObjectId(req.query[idName]));
				if (invalidId) throw new BadRequestError(`Invalid ${invalidId} passed`);

				next();
			} catch (error) {
				next(error);
			}
		};
	};

	static parseJson (req, res, next) {
		if (req.body.packaging) {
			if (req.body.packaging === undefined) {
				next();
			}
			else if ( typeof req.body.packaging === 'string' ) {
				try {
					// Attempt to parse the 'packaging' field as JSON
					let parsedPackaging = JSON.parse(req.body.packaging);

					if (Object.keys(parsedPackaging).length === 0) throw new BadRequestError('The packaging field cannot be an empty object');
					
					req.body.packaging = parsedPackaging;
					next();
				} catch (error) {
					// Handle JSON parsing error
					return res.status(400).json({ error: 'Invalid JSON format in the packaging field' });
				}
			}
		}
		next();
	};
}