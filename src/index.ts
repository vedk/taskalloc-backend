import express, { Request, Response, NextFunction } from "express";
import expressSession from "express-session";
import bodyParser from "body-parser";
import cors from "cors"
// import helmet from "helmet"

import bcrypt from "bcrypt";
import { createClient } from "redis";
import connectRedis from "connect-redis";
import { PrismaClient } from "@prisma/client";

declare module 'express-session' {
	export interface SessionData {
		ldap: string;
		passwd: string;
	}
}


const app = express();
const port: number = 3000;

/* Use helmet in production to secure against common attacks.
 * But we don't use this in development due to CORS.
 *
 * Please run "npm i helmet" before uncommenting the line below.
 */
// app.use(helmet());
app.use(cors({
	origin: "http://localhost:3001",
	credentials: true
}));

let redisClient = createClient({legacyMode: true});
redisClient.connect().catch(console.error);
let RedisStore = connectRedis(expressSession);
app.use(expressSession({
	store: new RedisStore({client: redisClient}),
	secret: "this is for mi 2022",
	resave: false,
	cookie: {maxAge: 5*60*1000}, // in ms, increase this to 4 days in production
	saveUninitialized: false
}));

const urlencodedParser = bodyParser.urlencoded({extended: false});

const prisma = new PrismaClient({
	rejectOnNotFound: {
		findFirst: {
			Auth: (err) => new Error("Auth record not found!")
		}
	}
});

app.post("/api/v1/login", urlencodedParser, async (req: Request, res: Response) => {
	console.log(req.body);
	if (req.session.ldap) {
		console.log("session exists");
	} else {
		//const authrecord = await prisma.auth.findFirst({where: {ldap: req.body.ldap}});
		prisma.auth.findFirst({where: {ldap: req.body.ldap}})
			.then((authrecord) => {
				bcrypt.compare(req.body.passwd, authrecord!.passwd, (err, result) => {
					if (result) {
						req.session.ldap = req.body.ldap;
						res.status(200).json({success: true, privlevel: authrecord!.privlevel});
					} else {
						res.status(401).json({success: false});
					}
				});
			})
			.catch((err) => {
				console.error(err);
				res.status(401).json({success: false});
			});
	}
});

// this middleware allows access to the data only if user is logged in
function authmw(req: Request, res: Response, next: NextFunction) {
	if (req.session.ldap) {
		next();
	} else {
		res.sendStatus(401);
	}
}

app.get("/api/v1/tasks", authmw, async (req: Request, res: Response, next: NextFunction) => {
	res.status(200).json(await prisma.task.findMany({include: {subtasks: true}}));
});

app.post("/api/v1/tasks", [authmw, urlencodedParser], async (req: Request, res: Response, next: NextFunction) => {
	try {
		await prisma.task.create({
			data: {
				name: req.body.name,
				desc: req.body.desc,
				subtasks: {connect: req.body.subtasks.map((e: string) => ({id: parseInt(e)}))},
				coordinators: {connect: req.body.coordinators.map((e: string) => ({id: parseInt(e)}))},
				organizers: {connect: req.body.organizers.map((e: string) => ({id: parseInt(e)}))}
			}
		});
	} catch (e) {
		console.error(e);
		res.sendStatus(500);
	}

	res.sendStatus(200);
});

app.get("/api/v1/cgs", authmw, async (req: Request, res: Response, next: NextFunction) => {
	res.status(200).json(await prisma.cg.findMany());
});

app.get("/api/v1/coordinators", authmw, async (req: Request, res: Response, next: NextFunction) => {
	res.status(	200).json(await prisma.coordinator.findMany());
});

app.post("/api/v1/coordinators", [authmw, urlencodedParser], async (req: Request, res: Response, next: NextFunction) => {
	try {
		await prisma.coordinator.create({
			data: {
				ldap: req.body.ldap,
				name: req.body.name
			}
		});
	} catch (e) {
		console.error(e);
		res.sendStatus(500);
	}

	res.sendStatus(200)
});

app.get("/api/v1/organizers", authmw, async (req: Request, res: Response, next: NextFunction) => {
	res.status(200).json(await prisma.organizer.findMany());
});

app.post("/api/v1/organizers", [authmw, urlencodedParser], async (req: Request, res: Response, next: NextFunction) => {
	try {
		await prisma.organizer.create({
			data: {
				ldap: req.body.ldap,
				name: req.body.name
			}
		});
	} catch (e) {
		console.error(e);
		res.sendStatus(500);
	}

	res.sendStatus(200)
});

app.get("/api/v1/events", authmw, async (req: Request, res: Response, next: NextFunction) => {
	res.status(200).json(await prisma.event.findMany());
});

app.get("/api/v1/events/:eid", authmw, async (req: Request, res: Response, next: NextFunction) => {
	res.status(200).json(await prisma.event.findUnique({
		where: {
			id: parseInt(req.params['eid']!)
		},
		include: {
			tasks: true,
			coordinators: true,
			organizers: true
		}
	}));
});

app.post("/api/v1/events", [authmw, urlencodedParser], async (req: Request, res: Response, next: NextFunction) => {
	try {
		await prisma.event.create({
			data: {
				name: req.body.name,
				desc: req.body.desc,
				tasks: {connect: req.body.tasks.map((e: string) => ({id: parseInt(e)}))},
				coordinators: {connect: req.body.coordinators.map((e: string) => ({id: parseInt(e)}))},
				organizers: {connect: req.body.organizers.map((e: string) => ({id: parseInt(e)}))}
			}
		});
	} catch (e) {
		console.error(e);
		res.sendStatus(500);
	}

	res.sendStatus(200);
});

app.post("/api/v1/updateevent/:evid", urlencodedParser, async (req: Request, res: Response, next: NextFunction) => {
	var t, c, o;

	if (req.body.tasks) {
		if (!Array.isArray(req.body.tasks))
			t = [{id: parseInt(req.body.tasks)}];
		else
			t = req.body.tasks.map((e: string) => ({id: parseInt(e)}));
	}
	
	if (req.body.coordinators) {
		if (!Array.isArray(req.body.coordinators))
			c = [{id: parseInt(req.body.coordinators)}];
		else
			c = req.body.coordinators.map((e: string) => ({id: parseInt(e)}));
	}

	if (req.body.organizers) {
		if (!Array.isArray(req.body.organizers))
			o = [{id: parseInt(req.body.organizers)}];
		else
			o = req.body.organizers.map((e: string) => ({id: parseInt(e)}));
	}

	try {
		await prisma.event.update({
			where: {id: parseInt(req.params['evid']!)},
			data: {
				name: req.body.name,
				desc: req.body.desc,
				tasks: {connect: t},
				coordinators: {connect: c},
				organizers: {connect: o}
			}
		});
	} catch (e) {
		console.error(e);
		res.sendStatus(500);
	}

	res.sendStatus(200);
});

app.listen(port, () => {
	console.log(`http://localhost:${port}`)
});