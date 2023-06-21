/**
 * Setup express server.
 */

import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import helmet from "helmet";
import express, { Request, Response, NextFunction } from "express";
import logger from "jet-logger";

import "express-async-errors";

import BaseRouter from "@src/routes/api";
import Paths from "@src/routes/constants/Paths";

import EnvVars from "@src/constants/EnvVars";
import HttpStatusCodes from "@src/constants/HttpStatusCodes";

import { NodeEnvs } from "@src/constants/misc";
import { RouteError } from "@src/other/classes";

// send mail
import mjml from "mjml";
import fs from "fs";

// **** Variables **** //

const app = express();

// **** Setup **** //

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(EnvVars.CookieProps.Secret));

// Show routes called in console during development
if (EnvVars.NodeEnv === NodeEnvs.Dev) {
  app.use(morgan("dev"));
}

// Security
if (EnvVars.NodeEnv === NodeEnvs.Production) {
  app.use(helmet());
}

// Add APIs, must be after middleware
app.use(Paths.Base, BaseRouter);

// Add error handler
app.use(
  (
    err: Error,
    _: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
  ) => {
    if (EnvVars.NodeEnv !== NodeEnvs.Test) {
      logger.err(err, true);
    }
    let status = HttpStatusCodes.BAD_REQUEST;
    if (err instanceof RouteError) {
      status = err.status;
    }
    return res.status(status).json({ error: err.message });
  }
);

// ** Front-End Content ** //

// Set views directory (html)
const viewsDir = path.join(__dirname, "views");
app.set("views", viewsDir);

// Set static directory (js and css).
const staticDir = path.join(__dirname, "public");
app.use(express.static(staticDir));

// Nav to users pg by default
app.get("/", (_: Request, res: Response) => {
  return res.redirect("/email");
});

app.get("/email", (req, res) => {
  const mjmlString: string = `<mjml>
  <mj-body background-color="#F4F4F4" color="#55575d" font-family="Arial, sans-serif">
    <mj-section background-color="#ffffff" background-repeat="repeat" padding-bottom="0px" padding-top="30px" padding="20px 0" text-align="center" vertical-align="top">
      <mj-column>
        <mj-image align="center" padding="10px 25px" src="http://5vph.mj.am/img/5vph/b/1g8pi/0gztq.png" target="_blank" width="214px"></mj-image>
        <mj-text align="left" color="#55575d" font-family="Arial, sans-serif" font-size="13px" line-height="22px" padding-bottom="15px" padding-top="0px" padding="10px 25px">
          <p style="text-align: center; margin: 10px 0;color:#151e23;font-size:14px;font-family:Georgia,Helvetica,Arial,sans-serif">Product | Concept | Contact</p>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

  // const mjmlTemplate = fs.readFileSync(
  //   __dirname + "/mjml-templates/email.mjml",
  //   "utf8"
  // );

  const htmlOutput = mjml(mjmlString).html;

  res.send(htmlOutput);
});

// Redirect to login if not logged in.
app.get("/users", (_: Request, res: Response) => {
  return res.sendFile("users.html", { root: viewsDir });
});

// **** Export default **** //

export default app;
