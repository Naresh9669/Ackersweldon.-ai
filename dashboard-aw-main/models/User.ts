import { models, model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    _id: string;
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'manager' | 'analyst' | 'viewer';
    team: string;
    permissions: string[];
    status: 'active' | 'inactive' | 'pending';
    created_at: Date;
    last_login: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema: Schema = new Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { 
        type: String, 
        required: true,
        minlength: 6
    },
    role: { 
        type: String, 
        required: true, 
        enum: ['admin', 'manager', 'analyst', 'viewer'],
        default: 'viewer'
    },
    team: { 
        type: String, 
        required: false,
        default: 'General'
    },
    permissions: [{ 
        type: String,
        enum: ['read', 'write', 'delete', 'admin', 'manage_users', 'view_analytics']
    }],
    status: { 
        type: String, 
        required: true, 
        enum: ['active', 'inactive', 'pending'],
        default: 'pending'
    },
    created_at: { 
        type: Date, 
        default: Date.now 
    },
    last_login: { 
        type: Date, 
        default: Date.now 
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Set permissions based on role
userSchema.pre('save', function(next) {
    if (this.isModified('role')) {
        switch (this.role) {
            case 'admin':
                this.permissions = ['read', 'write', 'delete', 'admin', 'manage_users', 'view_analytics'];
                break;
            case 'manager':
                this.permissions = ['read', 'write', 'manage_users', 'view_analytics'];
                break;
            case 'analyst':
                this.permissions = ['read', 'write', 'view_analytics'];
                break;
            case 'viewer':
                this.permissions = ['read'];
                break;
        }
    }
    next();
});

const User = models.User || model<IUser>('User', userSchema);
export default User;
