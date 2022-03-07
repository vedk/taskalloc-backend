import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
	// change this to 10 in production
	const saltRounds: number = 2;

	await prisma.auth.deleteMany({});
	await prisma.cg.deleteMany({});
	await prisma.coordinator.deleteMany({});
	await prisma.organizer.deleteMany({});

	console.log("adding CGs");
	const allcgdata = [
		{
			data: {
				ldap: "20d170019",
				name: "CG One"
			}
		},
		{
			data: {
				ldap: "20d170020",
				name: "CG Two"
			}
		},
		{
			data: {
				ldap: "20d170021",
				name: "CG Three"
			}
		},
	];

	allcgdata.forEach(async (e) => {
		await prisma.cg.create(e);
		bcrypt.hash(e.data.ldap, saltRounds, async (err, hash) => {
			console.log(`  ${e.data.ldap}`);
			await prisma.auth.create({
				data: {
					ldap: e.data.ldap,
					passwd: hash,
					privlevel: 0
				}
			});
		});
	});

	console.log("adding coordinators");
	const allcoordiedata = [
		{
			data: {
				ldap: "20d180019",
				name: "Coordie One"
			}
		},
		{
			data: {
				ldap: "20d180020",
				name: "Coordie Two"
			}
		},
		{
			data: {
				ldap: "20d180021",
				name: "Coordie Three"
			}
		},
		{
			data: {
				ldap: "20d180022",
				name: "Coordie Four"
			}
		}
	];

	allcoordiedata.forEach(async (e) => {
		await prisma.coordinator.create(e);
		bcrypt.hash(e.data.ldap, saltRounds, async (err, hash) => {
			console.log(`  ${e.data.ldap}`);
			await prisma.auth.create({
				data: {
					ldap: e.data.ldap,
					passwd: hash,
					privlevel: 1
				}
			});
		});
	});

	console.log("adding organizers");
	const allorgdata = [
		{
			data: {
				ldap: "20d190019",
				name: "Organizer One"
			}
		},
		{
			data: {
				ldap: "20d190020",
				name: "Organizer Two"
			}
		},
		{
			data: {
				ldap: "20d190021",
				name: "Organizer Three"
			}
		},
		{
			data: {
				ldap: "20d190022",
				name: "Organizer Four"
			}
		},
		{
			data: {
				ldap: "20d190023",
				name: "Organizer Five"
			}
		},
		{
			data: {
				ldap: "20d190024",
				name: "Organizer Six"
			}
		},
		{
			data: {
				ldap: "20d190025",
				name: "Organizer Seven"
			}
		}
	];

	allorgdata.forEach(async (e) => {
		await prisma.organizer.create(e);
		bcrypt.hash(e.data.ldap, saltRounds, async (err, hash) => {
			console.log(`  ${e.data.ldap}`);
			await prisma.auth.create({
				data: {
					ldap: e.data.ldap,
					passwd: hash,
					privlevel: 2
				}
			});
		});
	});

	/*await prisma.event.create({
		data: {
			name: "Event One",
			desc: "This is event one",
			coordinators: {connect: [{id: 1}, {id: 2}, {id: 3}]}
		}
	});*/
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});