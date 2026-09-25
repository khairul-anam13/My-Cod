import { Router } from "express";
import { categoriesRouter } from "./categories.routes.js";
import { conversationsRouter } from "./conversations.routes.js";
import { listingsRouter } from "./listings.routes.js";
import { locationsRouter } from "./locations.routes.js";
import { profilesRouter } from "./profiles.routes.js";
import { reportsRouter } from "./reports.routes.js";
import { reviewsRouter } from "./reviews.routes.js";
import { verificationRouter } from "./verification.routes.js";

export const apiRouter = Router();

apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/listings", listingsRouter);
apiRouter.use("/conversations", conversationsRouter);
apiRouter.use("/profiles", profilesRouter);
apiRouter.use("/reviews", reviewsRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/verification", verificationRouter);
apiRouter.use("/", locationsRouter);
