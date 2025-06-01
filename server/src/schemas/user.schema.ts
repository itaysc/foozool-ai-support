import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export const userSchema = new Schema({
    firstName: String,
    lastName: String,
    fullName: String,
    avatarImage: String,
    llmModel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LLMModel',
        required: false,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: false
    },
    registered: {
        type: Boolean,
        default: false,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    department: {
        type: String,
        required: false
    },
    group: {
        type: String,
    },
    roles: {
        type: [String],
    },
    scopes: {
        type: [String],
    },
}, {
    timestamps: true
});

// Pre-save hook to hash the password
userSchema.pre('save', async function(next) {
    if (this.isModified('firstName') || this.isModified('lastName')) {
        this.fullName = `${this.firstName} ${this.lastName}`;
    }
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err: any) {
        next(err);
    }
});

// Method to compare password
userSchema.methods.comparePassword = function(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Create and export the User model
export const UserModel = mongoose.model('User', userSchema);
export function getUserModel(dbConnection) {
    return dbConnection.model('User', userSchema);
}