/** Routes for Lunchly */

const express = require("express");
const { workerData } = require("worker_threads");
const db = require("./db");

const Customer = require("./models/customer");
const Reservation = require("./models/reservation");

const router = new express.Router();
// Use the express.urlencoded() middleware to parse form data
router.use(express.urlencoded({ extended: true }));

/** Homepage: show list of customers. */

router.get("/", async function (req, res, next) {
    try {
        const customers = await Customer.all();
        for (customer of customers) {
            customer.name = customer.fullNameCreator();
        }
        return res.render("customer_list.html", { customers });
    } catch (err) {
        return next(err);
    }
});

/** Form to add a new customer. */

router.get("/add/", async function (req, res, next) {
    try {
        return res.render("customer_new_form.html");
    } catch (err) {
        return next(err);
    }
});

/** Handle adding a new customer. */

router.post("/add/", async function (req, res, next) {
    try {
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const phone = req.body.phone;
        const notes = req.body.notes;

        const customer = new Customer({ firstName, lastName, phone, notes });
        await customer.save();

        return res.redirect(`/${customer.id}/`);
    } catch (err) {
        return next(err);
    }
});

router.post("/customers", async function (req, res, next) {
    try {
        const name = req.body.customer;
        const customerName = name
            .split(" ")
            .map((part) => {
                return part[0].toUpperCase() + part.substring(1);
            })
            .join(" ");
        const customer = await Customer.getByName(customerName);
        customer.name = customer.fullNameCreator();
        res.render("customer_list.html", { customer });
    } catch (err) {
        return next(err);
    }
});

/** Show a customer, given their ID. */

router.get("/:id", async function (req, res, next) {
    try {
        const customer = await Customer.get(req.params.id);
        const customerName = customer.fullNameCreator();
        const reservations = await customer.getReservations();

        return res.render("customer_detail.html", {
            customer,
            customerName,
            reservations,
        });
    } catch (err) {
        return next(err);
    }
});

/** Show form to edit a customer. */

router.get("/:id/edit/", async function (req, res, next) {
    try {
        const customer = await Customer.get(req.params.id);
        const customerName = customer.fullNameCreator();

        res.render("customer_edit_form.html", { customer, customerName });
    } catch (err) {
        return next(err);
    }
});

/** Handle editing a customer. */

router.post("/:id/edit/", async function (req, res, next) {
    try {
        const customer = await Customer.get(req.params.id);
        customer.firstName = req.body.firstName;
        customer.lastName = req.body.lastName;
        customer.phone = req.body.phone;
        customer.notes = req.body.notes;
        await customer.save();

        return res.redirect(`/${customer.id}/`);
    } catch (err) {
        return next(err);
    }
});

/** Handle adding a new reservation. */

router.post("/:id/add-reservation/", async function (req, res, next) {
    try {
        const customerId = req.params.id;
        const startAt = new Date(req.body.startAt);
        const numGuests = req.body.numGuests;
        const notes = req.body.notes;

        const reservation = new Reservation({
            customerId,
            startAt,
            numGuests,
            notes,
        });
        await reservation.save();

        return res.redirect(`/${customerId}/`);
    } catch (err) {
        return next(err);
    }
});

router.get("/:id/edit-reservation/:resId", async function (req, res, next) {
    try {
        const customer = await Customer.get(req.params.id);
        const reservation = await Reservation.get(req.params.resId);
        console.log(reservation);
        const customerName = customer.fullNameCreator();

        res.render("reservation_edit_form.html", {
            customer,
            customerName,
            reservation,
        });
    } catch (err) {
        return next(err);
    }
});

router.post("/:id/edit-reservation/:resId", async function (req, res, next) {
    try {
        const reservation = await Reservation.get(req.params.resId);
        reservation.customerId = req.params.id;
        reservation.startAt = new Date(req.body.startAt);
        console.log(reservation);

        reservation.numGuests = req.body.numGuests;
        reservation.notes = req.body.notes;

        await reservation.save();

        return res.redirect(`/${reservation.customerId}`);
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
