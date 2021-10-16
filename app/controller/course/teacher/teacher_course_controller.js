const Course = require('../model/course');
const moment = require('moment');
const Teacher = require('../../login/model/teacher/teacher_model');
// @route GET api/teacher/course/{id}
// @desc Returns a specific course
// @access Public
exports.show = async function (req, res) {
    try {
        const id = req.params.id;

        const course = await Course.findById(id);

        if (!course) return res.status(401).json({
            message: 'Course does not exist.'
        });

        res.status(200).json({
            course
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};


// @route POST api/teacher/course/addcourse
// @desc Add a new course
// @access Public
exports.addCourse = async (req, res) => {
    try {
        const id = req.body.teacherId;
        const teacher = await Teacher.findById(id);
        const newCourse = new Course({
            ...req.body,
        });

        await newCourse.generateRandomCourseCode();
        const course_ = await newCourse.save();
        course_.teacher = teacher;
        await course_.save();

        res.status(200).json({
            message: 'Course successfully created'
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};

// @route DELETE api/teacher/course/deletecourse/{id}
// @desc Delete course
// @access Public
exports.deleteCourse = async function (req, res) {
    try {
        const id = req.params.id;

        await Course.findByIdAndDelete(id);
        res.status(200).json({
            message: 'Course has been deleted'
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// @route POST api/teacher/course/{id}/editschedule
// @desc Delete course
// @access Public
exports.editCourseSchedule = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const courseStartDate = req.body.courseStartDate; //20.03.2014
        const courseEndDate = req.body.courseEndDate; //20.03.2015
        const courseTimes = req.body.courseTimes; //09:00-12:00

        const currentCourse = await Course.findById(courseId);
        const dateArray = [];
        const startDate = moment(courseStartDate, 'DD-MM-YYYY');
        const endDate = moment(courseEndDate, 'DD-MM-YYYY');
        while (startDate <= endDate) {
            dateArray.push(moment(startDate));
            startDate = moment(startDate).add(7, 'days');
        }

        const currentCourse_ = await currentCourse.attendance.push(dateArray, courseTimes);
        await currentCourse_.save();
        res.status(200).json({
            message: 'Course schedule successfully added'
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};