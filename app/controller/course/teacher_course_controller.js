const Course = require('./model/course_model');
const Student = require('../student/model/student_model');
const Teacher = require('../teacher/model/teacher_model');

const moment = require('moment');
const fs = require('fs-extra');

const AWS = require('aws-sdk');
const config = new AWS.Config({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});
const rekognition = new AWS.Rekognition();

// @route POST api/teacher/course/addcourse
// @desc Add new course
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

// @route POST api/teacher/course/{id}/addschedule
// @desc Add course schedule
// @access Public
exports.addCourseSchedule = async (req, res) => {
    try {
        const id = req.params.id;
        let courseStartDate = req.body.courseStartDate; //20.10.2021
        let courseEndDate = req.body.courseEndDate; //20.10.2021
        let courseTime = req.body.courseTime; //09:00-12:00
        const currentCourse = await Course.findById(id);

        if (!currentCourse) res.status(401).json({
            message: 'Course does not exist'
        });

        let courseScheduleArray = [];
        let timeArray = [];
        let dateArray = [];

        let startDate = moment(courseStartDate, 'DD-MM-YYYY');
        let endDate = moment(courseEndDate, 'DD-MM-YYYY');

        while (startDate <= endDate) {
            dateArray.push(moment(startDate).format('DD-MM-YYYY'));
            timeArray.push(courseTime);
            startDate = moment(startDate).add(7, 'days');
        }

        for (let i = 0; i < dateArray.length; i++) {
            courseScheduleArray[i] = {};
            courseScheduleArray[i].date = dateArray[i];
            courseScheduleArray[i].time = timeArray[i];
        }

        currentCourse.attendance = courseScheduleArray;
        await currentCourse.save();

        res.status(200).json({
            message: 'Course schedule successfully added'
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};
// @route GET api/teacher/course/{id}
// @desc Return course
// @access Public
exports.show = async function (req, res) {
    try {
        const id = req.params.id;
        const course = await Course.findById(id);

        if (!course) return res.status(401).json({
            message: 'Course does not exist'
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




// @route POST api/teacher/course/{id}/checkattendance
// @desc Check course attendance
// @access Public
exports.checkAttendance = async (req, res) => {
    try {
        const id = req.params.id;
        const currentCourse = await Course.findById(id);

        if (!currentCourse) res.status(401).json({
            message: 'Course does not exist'
        });

        var image = req.file;

        if (!image) return res.status(401).json({
            message: 'You must upload at least one image'
        });

        var imageByte = Buffer(fs.readFileSync(image.path).toString('base64'), 'base64');
        let studentsArray = currentCourse.attendance[0].students;

        for (let i = 0; i < studentsArray.length; i++) {
            var studentId = studentsArray[i].id;
            var student = await Student.findById(studentId);
            var studentImageByte = student.studentImage.imageByte;
            var faceData = await rekognition.compareFaces({
                SimilarityThreshold: 70,
                TargetImage: {
                    Bytes: imageByte
                },
                SourceImage: {
                    Bytes: studentImageByte
                }
            }).promise();

            if (faceData.FaceMatches.length > 0) {
                studentsArray[i].attendanceStatus = true;
            }
            await currentCourse.save();
        }

        res.status(200).json({
            message: 'Attendance for the course was successfully taken'
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};